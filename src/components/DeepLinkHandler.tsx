import { useDeepLinks } from "@/hooks/useDeepLinks";

export const DeepLinkHandler = ({ children }: { children: React.ReactNode }) => {
  useDeepLinks();
  return <>{children}</>;
};
