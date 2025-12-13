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
import {
  Brush,
  CircleSlash,
  Clock,
  Hand,
  LogIn,
  Move,
  PaintBucket,
  PointerOff,
  Ticket,
  View,
  ZoomIn,
} from "lucide-react";

const content = [
  <div>
    <h3 className="text-lg font-semibold">欢迎来到 Paint2025！</h3>
    <img src="/icon.svg" alt="App Icon" className="mx-auto w-full" />
    <p className="mt-2 text-sm text-muted-foreground">
      Paint2025
      是一个多人在线协作的画布，你可以与所有用户同时创作、覆盖、合作或对抗！共同定格
      2025 年的美好回忆！
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">登录以开始</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      游客可以自由的浏览。
      <br />
      但要参与绘画，你需要先{" "}
      <LogIn className="inline-block h-[1em] w-[1em] align-sub" /> <b>登录</b>
      。登录后，你将获得属于你的{" "}
      <Ticket className="inline-block h-[1em] w-[1em] align-sub" />{" "}
      <b>绘画 Token</b>。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      如果你的 Token 不小心泄漏了，不要担心，你可以随时在设置中重新生成它们。
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">在绘画模式下操纵画布</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      处于 <Brush className="inline-block h-[1em] w-[1em] align-sub" />{" "}
      <b>绘画模式</b> 时，你可以绘制像素
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      <Brush className="inline-block h-[1em] w-[1em] align-sub" />{" "}
      <b>单击鼠标左键</b> 或 <b>触摸屏幕</b> 以绘制像素点
      <br />
      <ZoomIn className="inline-block h-[1em] w-[1em] align-sub" />{" "}
      <b>鼠标滚轮</b> 或 <b>双指捏合</b> 以缩放
      <br />
      <Move className="inline-block h-[1em] w-[1em] align-sub" />{" "}
      <b>鼠标中键/右键拖动</b> 或 <b>触摸拖动</b> 以平移
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">在浏览模式下操纵画布</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      处于 <View className="inline-block h-[1em] w-[1em] align-sub" />{" "}
      <b>浏览模式</b> 时，你可以自由浏览
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      <PointerOff className="inline-block h-[1em] w-[1em] align-sub" />{" "}
      <b>单击鼠标左键 或 触摸</b> 将不会绘制任何像素点
      <br />
      <Hand className="inline-block h-[1em] w-[1em] align-sub" />{" "}
      <b>按下鼠标左键并拖动</b> 可以自由平移，不用担心破坏画笔
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">点数和冷却时间</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      <PaintBucket className="inline-block h-[1em] w-[1em] align-sub" />{" "}
      <b>点数</b> 是你绘画的“体力值”。
      <br />
      每个 Token 每次绘画都会消耗你的一个点数，如果点数为 0，你就无法继续绘画。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      <Clock className="inline-block h-[1em] w-[1em] align-sub" />{" "}
      <b>冷却时间</b> 是体力回复的时间间隔。
      <br />
      冷却时间结束后，你的点数会自动 +1，直到达到最大点数。
      <br />
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">独行？结伴？还是代码小子？</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      你可以选择<b>独自作画</b>，或者<b>收集</b>他人的 Token 来和他们一起绘画。
      <br />
      甚至你可以<b>写代码</b>来自动化你的绘画过程！
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      我们会在 GitHub 上提供 API 文档和官方样例程序，加入{" "}
      <a
        href="https://join.geekpie.club/qq"
        className="underline hover:text-foreground"
      >
        GeekPie QQ 交流群
      </a>{" "}
      来关注我们的最新进展！
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">不允许！</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      🚫 请不要绘制任何不适当的内容，包括但不限于涉政、色情、暴力、仇恨言论等。
      <br />
      🚫 请不要攻击服务器，公开他人信息。
      <br />
      🚫 请不要用显然随意的像素点或图案破坏他人的作品或者搞得一团糟。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      ⚠️ 违反规定的用户可能会被封禁。
      <br />
    </p>
  </div>,
  <div>
    <h3 className="text-lg font-semibold">一起创造 2025 的回忆！</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      我们将 <b>在 2026/01/01 关闭 Paint2025</b>
      ，届时将会用推文记录下大家的杰作。
    </p>
    <p className="mt-2 text-sm text-muted-foreground">
      快来留下你的印记吧！祝你玩得开心！
    </p>
    <p className="mt-8 text-sm text-muted-foreground w-full text-right">
      ——GeekPie 团队
    </p>
  </div>,
];

export default function GuideCarousel({
  setIsFinished,
}: {
  setIsFinished: React.Dispatch<React.SetStateAction<boolean>>;
}) {
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
    <div className="mx-auto max-w-xs w-full py-4">
      <Carousel setApi={setApi} className="w-full max-w-xs">
        <CarouselContent className="pb-2">
          {Array.from({ length: content.length }).map((_, index) => (
            <CarouselItem key={index} className="my-auto">
              <Card className="shadow-none border-none">
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
