import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-2xl font-bold tracking-tight text-foreground">
          QR Scanner
        </Text>
        <Text className="mt-2 text-center text-sm text-muted-foreground">
          Scan a QR code to check in or borrow a book
        </Text>
      </View>
    </SafeAreaView>
  );
}
