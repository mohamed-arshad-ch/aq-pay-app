"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Lock, LogOut, Settings, Shield, Wallet } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/currency-utils";
import { responseCookiesToRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { BankAccount } from "@/types";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  dateOfBirth: string;
  profileImage: string;
  createdAt: string;
  lastLogin: string;
  wallet: {
    id: string;
    balance: number;
    currency: string;
  };
  accounts: Array<{
    id: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    date: string;
  }>;
}

export function ProfileOverview() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/user/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch accounts. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!user) return 0;

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
      "dateOfBirth",
    ];

    const completedFields = requiredFields.filter(
      (field) => !!user[field as keyof typeof user]
    );
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  // Mask sensitive information
  const maskEmail = (email: string) => {
    if (!email) return "";
    const [username, domain] = email.split("@");
    return `${username.substring(0, 3)}${"*".repeat(
      username.length - 3
    )}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return "nil";
    return `${phone.substring(0, 3)}${"*".repeat(
      phone.length - 7
    )}${phone.substring(phone.length - 4)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "nil";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear the cookie
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      // Dispatch logout action to clear Redux state
      dispatch(logout());

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      router.push("/auth/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  if (isLoading) {
    return <ProfileOverviewSkeleton />;
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load profile data</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const profileCompletionPercentage = calculateProfileCompletion();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Your basic account information and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border">
              <AvatarImage
                src={user.profileImage || ""}
                alt={`${user.firstName} ${user.lastName}`}
              />
              <AvatarFallback className="text-2xl">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Member since {formatDate(user.createdAt)}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p>{maskEmail(user.email)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p>{maskPhone(user.phoneNumber ?? "")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Login
                  </p>
                  <p>{formatDate(user.lastLogin ?? "")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <p>Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Linked Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{accounts?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {user.transactions?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer"
          onClick={() => router.push("/dashboard/wallet")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Wallet className="h-4 w-4 mr-1" /> Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(
                user.wallet?.balance || 0,
                user.wallet?.currency || "USD"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>
            Complete your profile to unlock all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium">
                {profileCompletionPercentage}%
              </span>
            </div>
            <Progress value={profileCompletionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          onClick={() => router.push("/dashboard/profile/edit")}
        >
          <Edit className="h-5 w-5" />
          <span>Edit Profile</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          onClick={() => router.push("/dashboard/profile/security")}
        >
          <Lock className="h-5 w-5" />
          <span>Security</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          onClick={() => router.push("/dashboard/profile/preferences")}
        >
          <Settings className="h-5 w-5" />
          <span>Preferences</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center justify-center gap-2"
          onClick={() => router.push("/dashboard/profile/verification")}
        >
          <Shield className="h-5 w-5" />
          <span>Verification</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-primary/10 border-primary text-primary hover:bg-primary/20"
          onClick={() => router.push("/dashboard/wallet")}
        >
          <Wallet className="h-5 w-5" />
          <span>My Wallet</span>
        </Button>

        <Button
          variant="destructive"
          className="h-auto py-4 flex flex-col items-center justify-center gap-2 col-span-1 sm:col-span-2 md:col-span-5 mt-4"
          onClick={handleLogout}
        >
          <LogOut className="h-3 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}

function ProfileOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Your basic account information and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1 space-y-4">
              <div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-36 mt-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
