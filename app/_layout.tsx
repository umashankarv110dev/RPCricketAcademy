import React from "react";

import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { AuthProvider } from "../src/context/AuthContext";
import { initializeDatabase } from "../src/database/initDatabase";

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="rpca.db"
      onInit={initializeDatabase}
    >
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </AuthProvider>
    </SQLiteProvider>
  );
}