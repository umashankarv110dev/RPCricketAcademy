import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

type Coach = {
  id: number;
  name: string;
  mobile: string;
};

type AuthContextType = {
  coach: Coach | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  onboardingCompleted: boolean;

  completeOnboarding: () => Promise<void>;
  login: (mobile: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const STORAGE_KEYS = {
  onboarding: "rpca_onboarding_completed",
  session: "rpca_coach_session",
};

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [coach, setCoach] = useState<Coach | null>(null);

  const [onboardingCompleted, setOnboardingCompleted] =
    useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const onboarding =
        await AsyncStorage.getItem(STORAGE_KEYS.onboarding);

      const session =
        await AsyncStorage.getItem(STORAGE_KEYS.session);

      if (onboarding === "true") {
        setOnboardingCompleted(true);
      }

      if (session) {
        setCoach(JSON.parse(session));
      }
    } catch (error) {
      console.error(
        "RPCA session restore error:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function completeOnboarding() {
    await AsyncStorage.setItem(
      STORAGE_KEYS.onboarding,
      "true"
    );

    setOnboardingCompleted(true);
  }

  async function login(
    mobile: string,
    password: string
  ): Promise<boolean> {
    /*
     * TEMPORARY DEMO LOGIN
     *
     * Later this will be replaced with
     * SQLite/database authentication or API authentication.
     */

    if (
      mobile === "9876543210" &&
      password === "123456"
    ) {
      const demoCoach: Coach = {
        id: 1,
        name: "RPCA Coach",
        mobile: "9876543210",
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.session,
        JSON.stringify(demoCoach)
      );

      setCoach(demoCoach);

      return true;
    }

    return false;
  }

  async function logout() {
    await AsyncStorage.removeItem(
      STORAGE_KEYS.session
    );

    setCoach(null);
  }

  return (
    <AuthContext.Provider
      value={{
        coach,
        isLoading,
        isLoggedIn: !!coach,
        onboardingCompleted,
        completeOnboarding,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}