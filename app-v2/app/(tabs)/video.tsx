import { Text } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n";

export default function VideoScreen() {
  const { t } = useI18n();
  return (
    <ScreenContainer className="items-center justify-center">
      <Text className="text-2xl font-bold text-foreground">{t.tabs.video}</Text>
      <Text className="text-muted mt-2">Coming soon...</Text>
    </ScreenContainer>
  );
}
