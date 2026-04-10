import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setError(error.message);
        else setError("Check your email to confirm your account.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg px-6"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center">
        <Text className="text-text text-3xl font-semibold mb-1">nocturnal</Text>
        <Text className="text-muted text-sm mb-10">your journal, your words</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#71717a"
          keyboardType="email-address"
          autoCapitalize="none"
          className="bg-surface text-text rounded-xl px-4 py-3.5 mb-3"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#71717a"
          secureTextEntry
          className="bg-surface text-text rounded-xl px-4 py-3.5 mb-4"
          onSubmitEditing={submit}
        />

        {error ? (
          <Text className="text-red-400 text-sm mb-3">{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={submit}
          disabled={loading}
          className="bg-accent rounded-2xl py-4 items-center mb-4"
        >
          {loading ? (
            <ActivityIndicator color="#09090b" />
          ) : (
            <Text className="text-bg font-semibold">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="items-center"
        >
          <Text className="text-muted text-sm">
            {mode === "signin"
              ? "No account? Sign up"
              : "Have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
