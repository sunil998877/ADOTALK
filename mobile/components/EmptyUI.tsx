import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type EmptyUIProps = {
  title: string;
  subtitle?: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  iconColor?: string;
  iconSize?: number;
  buttonLabel?: string;
  onPressButton?: () => void;
};

function EmptyUI({
  title,
  subtitle,
  iconName = "chatbubbles-outline",
  iconColor = "#F4A261",
  iconSize = 36,
  buttonLabel,
  onPressButton,
}: EmptyUIProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <View className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 items-center justify-center mb-5">
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </View>
      <Text className="text-foreground text-xl font-semibold text-center">{title}</Text>
      {subtitle ? (
        <Text className="text-muted-foreground text-sm mt-2 text-center leading-5">{subtitle}</Text>
      ) : null}
      {buttonLabel && onPressButton ? (
        <Pressable
          className="mt-8 bg-primary px-8 py-3.5 rounded-full active:opacity-90"
          onPress={onPressButton}
        >
          <Text className="text-surface-dark font-semibold text-base">{buttonLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default EmptyUI;
