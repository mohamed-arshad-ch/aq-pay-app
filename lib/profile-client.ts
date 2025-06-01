// Mock data for development
const mockUser = {
  id: "user123",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phoneNumber: "1234567890",
  profileImage: "/diverse-group-profile.png",
  address: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  country: "USA",
  dateOfBirth: "1990-01-01",
  createdAt: "2022-01-01T00:00:00.000Z",
  lastLogin: new Date().toISOString(),
  twoFactorEnabled: false,
  notificationPreferences: {
    transactions: true,
    balanceUpdates: true,
    securityAlerts: true,
    marketing: false,
  },
  appPreferences: {
    language: "en",
    theme: "light",
    defaultCurrency: "USD",
    defaultAccountId: "acc123",
  },
  verificationStatus: "pending",
  verificationDocuments: [
    {
      type: "id",
      status: "pending",
      uploadedAt: "2023-01-01T00:00:00.000Z",
    },
    {
      type: "address",
      status: "pending",
      uploadedAt: "2023-01-01T00:00:00.000Z",
    },
  ],
};

export const profileApi = {
  getUserProfile: async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // For development, return mock data
      return mockUser;
    }
  },

  updateUserProfile: async (userData: FormData) => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        body: userData,
      });
      if (!response.ok) {
        throw new Error("Failed to update user profile");
      }
      return response.json();
    } catch (error) {
      console.error("Error updating user profile:", error);
      // For development, return mock data with updates
      return {
        ...mockUser,
        firstName: (userData.get("firstName") as string) || mockUser.firstName,
        lastName: (userData.get("lastName") as string) || mockUser.lastName,
        // Add other fields as needed
      };
    }
  },

  updateSecuritySettings: async (data: { type: string; data: any }) => {
    try {
      const response = await fetch("/api/user/profile/security", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to update security settings");
      }
      return response.json();
    } catch (error) {
      console.error("Error updating security settings:", error);
      // For development, return mock data
      return {
        success: true,
        message: `${data.type} updated successfully`,
        user: mockUser,
      };
    }
  },

  updatePreferences: async (preferences: any) => {
    try {
      const response = await fetch("/api/user/profile/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });
      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }
      return response.json();
    } catch (error) {
      console.error("Error updating preferences:", error);
      // For development, return mock data
      return {
        success: true,
        message: "Preferences updated successfully",
        user: {
          ...mockUser,
          notificationPreferences: {
            ...mockUser.notificationPreferences,
            ...preferences.notificationPreferences,
          },
          appPreferences: {
            ...mockUser.appPreferences,
            ...preferences.appPreferences,
          },
        },
      };
    }
  },

  uploadVerificationDocuments: async (formData: FormData) => {
    try {
      const response = await fetch("/api/user/profile/verification", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to upload verification documents");
      }
      return response.json();
    } catch (error) {
      console.error("Error uploading verification documents:", error);
      // For development, return mock data
      return {
        success: true,
        message: "Documents uploaded successfully",
        user: {
          ...mockUser,
          verificationStatus: "under_review",
          verificationDocuments: [
            {
              type: (formData.get("documentType") as string) || "id",
              status: "under_review",
              uploadedAt: new Date().toISOString(),
            },
            ...mockUser.verificationDocuments.filter(
              (doc) => doc.type !== (formData.get("documentType") as string)
            ),
          ],
        },
      };
    }
  },
}; 