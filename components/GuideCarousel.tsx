"use client";

import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Progress } from "@/components/ui/progress";

const content = [
  <div>
    <h3 className="text-lg font-semibold">欢迎来到 Paint2025！</h3>
    <img src="/icon.svg" alt="App Icon" className="mx-auto w-full" />
    <p className="mt-2 text-sm text-muted-foreground">
      Paint2025 是一个多人在线协作的画布，你可以与所有用户同时创作、覆盖、合作或对抗！
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">登录以开始</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      游客可以自由的浏览。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      但要参与绘画，你需要先登录。登录后，你将获得属于你的绘画 Token。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      如果你的 Token 不小心泄漏了，不要担心，你可以随时在设置中重新生成它们。
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">冷却时间</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      每个 Token 每次绘画都会消耗你的一个点数，并且会触发冷却时间。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      在冷却时间内，你无法用这个 Token 继续绘画。
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">独行？结伴？还是代码小子？</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      你可以选择独自作画，或者收集他人的 Token 来和他们一起绘画。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      甚至你可以写代码来自动化你的绘画过程！
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">不允许！</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      🚫 请不要绘制任何不适当的内容，包括但不限于色情、暴力、仇恨言论等。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      🚫 请不要攻击服务器，公开他人信息。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      🚫 请不要用显然随意的像素点或图案破坏他人的作品或者搞得一团糟。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      ⚠️ 违反规定的用户可能会被封禁。
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">一起创造 2025 的回忆！</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      我们将在 2026/01/01 关闭 Paint2025，届时将会用推文记录下大家的杰作。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      快来留下你的印记吧！祝你玩得开心！
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      ——GeekPie 团队
    </p>
  </div>,
]

export default function GuideCarousel(
  { setIsFinished }: { setIsFinished: React.Dispatch<React.SetStateAction<boolean>> }
) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const progress = (current * 100) / count;

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  React.useEffect(() => {
    setIsFinished(current === content.length && count > 0);
  }, [current, count, setIsFinished]);

  return (
    <div className="mx-auto max-w-xs py-4">
      <Carousel setApi={setApi} className="w-full max-w-xs">
        <CarouselContent className="pb-2">
          {Array.from({ length: content.length }).map((_, index) => (
            <CarouselItem key={index} className="my-auto">
              <Card>
                <CardContent className="flex aspect-video items-center justify-center p-6">
                  {content[index]}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="top-[calc(100%+0.5rem)] translate-y-0 left-0" />
        <CarouselNext className="top-[calc(100%+0.5rem)] translate-y-0 left-2 translate-x-full" />
      </Carousel>
      <Progress value={progress} className="mt-4 w-24 ml-auto" />
    </div>
  );
}
