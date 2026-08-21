import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";

type Coach = {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
};

type AuthContextType = {
  coach: Coach | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  onboardingCompleted: boolean;

  completeOnboarding: () => Promise<void>;

  login: (
    mobile: string,
    password: string
  ) => Promise<boolean>;

  logout: () => Promise<void>;
};

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

const STORAGE_KEYS = {
  onboarding: "rpca_onboarding_completed",
  session: "rpca_coach_session",
};

const DATABASE_NAME = "rpca.db";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [coach, setCoach] =
    useState<Coach | null>(null);

  const [
    onboardingCompleted,
    setOnboardingCompleted,
  ] = useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  /**
   * Restore login session when app starts.
   *
   * IMPORTANT:
   * We don't blindly trust AsyncStorage.
   * We check whether the coach still exists
   * in the SQLite coaches table.
   */
  async function restoreSession() {
    try {
      setIsLoading(true);

      const onboarding =
        await AsyncStorage.getItem(
          STORAGE_KEYS.onboarding
        );

      if (onboarding === "true") {
        setOnboardingCompleted(true);
      } else {
        setOnboardingCompleted(false);
      }

      const session =
        await AsyncStorage.getItem(
          STORAGE_KEYS.session
        );

      /*
       * No saved session.
       */
      if (!session) {
        setCoach(null);
        return;
      }

      let savedCoach: Coach;

      try {
        savedCoach = JSON.parse(session);
      } catch {
        /*
         * Corrupted session.
         */
        await clearSession();
        return;
      }

      /*
       * Basic session validation.
       */
      if (!savedCoach?.id) {
        await clearSession();
        return;
      }

      /*
       * Open RPCA database and verify that
       * the coach still exists.
       */
      const db =
        await SQLite.openDatabaseAsync(
          DATABASE_NAME
        );

      const registeredCoach =
        await db.getFirstAsync<Coach>(
          `
          SELECT
            id,
            name,
            mobile,
            email
          FROM coaches
          WHERE id = ?
          LIMIT 1
          `,
          savedCoach.id
        );

      /*
       * Coach no longer exists.
       * Remove stale session.
       */
      if (!registeredCoach) {
        await clearSession();
        return;
      }

      /*
       * Use fresh database information.
       */
      setCoach(registeredCoach);
    } catch (error) {
      console.error(
        "RPCA session restore error:",
        error
      );

      await clearSession();
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Clear authentication session completely.
   */
  async function clearSession() {
    try {
      await AsyncStorage.removeItem(
        STORAGE_KEYS.session
      );

      setCoach(null);
    } catch (error) {
      console.error(
        "RPCA clear session error:",
        error
      );

      /*
       * Even if storage fails, clear React state.
       */
      setCoach(null);
    }
  }

  /**
   * Complete onboarding.
   */
  async function completeOnboarding() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.onboarding,
        "true"
      );

      setOnboardingCompleted(true);
    } catch (error) {
      console.error(
        "RPCA onboarding error:",
        error
      );

      throw error;
    }
  }

  /**
   * Login using ONLY registered coaches.
   *
   * Mobile + password must exist together
   * in the coaches table.
   */
  async function login(
    mobile: string,
    password: string
  ): Promise<boolean> {
    try {
      const cleanMobile =
        mobile.trim();

      if (!cleanMobile || !password) {
        return false;
      }

      const db =
        await SQLite.openDatabaseAsync(
          DATABASE_NAME
        );

      /*
       * Find registered coach.
       *
       * IMPORTANT:
       * There is no demo login here.
       */
      const registeredCoach =
        await db.getFirstAsync<
          Coach
        >(
          `
          SELECT
            id,
            name,
            mobile,
            email
          FROM coaches
          WHERE mobile = ?
            AND password = ?
          LIMIT 1
          `,
          cleanMobile,
          password
        );

      /*
       * Invalid credentials.
       */
      if (!registeredCoach) {
        return false;
      }

      /*
       * Save ONLY safe coach information.
       *
       * Password is NEVER stored in the session.
       */
      await AsyncStorage.setItem(
        STORAGE_KEYS.session,
        JSON.stringify(
          registeredCoach
        )
      );

      /*
       * Update React authentication state.
       */
      setCoach(registeredCoach);

      return true;
    } catch (error) {
      console.error(
        "RPCA coach login error:",
        error
      );

      return false;
    }
  }

  /**
   * Logout completely.
   */
  async function logout() {
    try {
      /*
       * First clear React state.
       * This immediately makes isLoggedIn false.
       */
      setCoach(null);

      /*
       * Then remove persisted session.
       */
      await AsyncStorage.removeItem(
        STORAGE_KEYS.session
      );
    } catch (error) {
      console.error(
        "RPCA logout error:",
        error
      );

      /*
       * Make sure the application is still
       * considered logged out.
       */
      setCoach(null);

      throw error;
    }
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
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}