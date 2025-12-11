"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCasdoorSdk } from "@/lib/casdoor";
import { useRuntimeConfigContext } from "@/components/RuntimeConfigProvider";
import { toast } from "sonner";
import { Loader } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { config } = useRuntimeConfigContext();

  useEffect(() => {
    const sdk = getCasdoorSdk();
    sdk
      .exchangeForAccessToken()
      .then(async (res) => {
        if (res && res.access_token) {
          // Get Token
          localStorage.setItem("casdoor_token", res.access_token);

          // Exchange for Draw Token
          try {
            const response = await fetch("/api/auth/exchange", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: res.access_token }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.token) {
                console.log("Draw token received", data.token);
                localStorage.setItem("draw_token", data.token);
              }
            }
          } catch (e) {
            console.error("Token exchange failed", e);
          }

          return sdk.getUserInfo(res.access_token);
        }
      })
      .then((res) => {
        router.push("/");
        if (res) {
          localStorage.setItem("casdoor_user", JSON.stringify(res));
          toast.success(`欢迎回来！${res.name || res.id || "Anonymous"}`);
        }
        // Storage Token
        // Cookies.set("casdoorUser", JSON.stringify(res));
      })
      .catch((err) => {
        console.error("登录失败", err);
        toast.error("登录失败: " + (err.message || err.toString()));
      });
  }, [searchParams, router, config]);

  return (
    <div className="flex items-center justify-center h-screen w-full bg-background gap-3">
      <div className="text-lg font-medium">正在登录……</div>
      <Loader className="h-5 w-5 animate-spin" />
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-full bg-background gap-3">
          <div className="text-lg font-medium">正在登录……</div>
          <Loader className="h-5 w-5 animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
