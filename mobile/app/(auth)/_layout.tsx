import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Slot } from "expo-router";

const AuthLayout = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  if (isSignedIn) return <Redirect href={"/(tabs)"} />;

  return <Slot />;
};

export default AuthLayout;
