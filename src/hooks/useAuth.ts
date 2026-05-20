import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

export type Tier = "stock" | "creator" | "pro";

export type TimUser = {
  id: number;
  unionId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: "user" | "admin";
  tier: Tier;
  trialActive: boolean;
  trialEndsAt: Date | null;
  dailyGenerations: number;
  lastGenerationDate: string | null;
  onboarded: boolean;
  firstCreateVisit: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt: Date;
};

const GUEST_KEY = "tim-guest";

function getGuestUser(): TimUser | undefined {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as TimUser;
  } catch { return undefined; }
}

function setGuestUser(): TimUser {
  const user: TimUser = {
    id: 0,
    unionId: "guest",
    name: "Guest",
    email: null,
    avatar: null,
    role: "user",
    tier: "stock",
    trialActive: false,
    trialEndsAt: null,
    dailyGenerations: 0,
    lastGenerationDate: null,
    onboarded: true,
    firstCreateVisit: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: new Date(),
  };
  localStorage.setItem(GUEST_KEY, JSON.stringify(user));
  return user;
}

function clearGuestUser() {
  localStorage.removeItem(GUEST_KEY);
}

export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: serverUser,
    isLoading: serverLoading,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      window.location.reload();
    },
  });

  const logout = useCallback(() => {
    clearGuestUser();
    logoutMutation.mutate();
    window.location.reload();
  }, [logoutMutation]);

  const enableGuest = useCallback(() => {
    setGuestUser();
    window.location.hash = "/create";
  }, []);

  // Check for guest user
  const guestUser = useMemo(() => getGuestUser(), []);
  const user = (serverUser as TimUser | undefined) || guestUser;
  const isGuest = !!guestUser && !serverUser;
  const isLoading = serverLoading && !guestUser;

  // Tier helpers
  const tier = (user?.tier || "stock") as Tier;
  const isPro = tier === "pro";
  const isCreator = tier === "creator" || tier === "pro";
  const canUseClaude = isCreator && !isGuest;
  const canExtend = isCreator && !isGuest;
  const trialActive = user?.trialActive || false;
  const trialDaysRemaining = user?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isGuest,
      isLoading,
      logout,
      enableGuest,
      refresh: () => utils.invalidate(),
      // T.I.M. tier helpers
      tier,
      isPro,
      isCreator,
      canUseClaude,
      canExtend,
      trialActive,
      trialDaysRemaining,
    }),
    [user, isGuest, isLoading, logout, enableGuest, utils, tier, isPro, isCreator, canUseClaude, canExtend, trialActive, trialDaysRemaining],
  );
}
