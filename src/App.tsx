import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Desktop from "@/imports/Desktop2/index";
import "./anim.css";

const BASE_W = 1440;
const BASE_H = 7051;

export default function App() {
  const [scale, setScale] = useState(1);
  const outerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Масштабируем фикс-макет 1440px под реальную ширину контейнера
  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const update = () => {
      const w = outer.clientWidth;
      if (w) setScale(w / BASE_W);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    return () => ro.disconnect();
  }, []);

  // Анимации: появление при скролле + плавающие 3D-иконки
  useEffect(() => {
    const wrap = canvasRef.current;
    const root = wrap?.querySelector<HTMLElement>('[data-name="Desktop - 2"]');
    if (!root) return;

    // Плавающие 3D-объекты (иконки преимуществ)
    const floatHashes = [
      "2b97bd34bc76624118ae569e0516e160c7b5c82e", // рупор
      "cc2fe9871a05711f08867a670f269551036a80a0", // стакан
      "67a02827b90e135f0d39676102add259a0f374b9", // кольцо
      "3f5e52fce50da6c673374484a25f8f5204922d00", // книга
    ];
    floatHashes.forEach((h, i) => {
      const img = root.querySelector<HTMLElement>(`img[src*="${h}"]`);
      if (img) {
        img.classList.add("anim-float");
        img.style.animationDelay = `${i * 0.4}s`;
      }
    });

    // Reveal: анимируем контентные блоки (пропускаем фоновые слои)
    const skip = (c: string) =>
      c.includes("bg-gradient") ||
      c.includes("from-[") ||
      c.includes("w-[1440px]") ||
      c.includes("w-[1441px]");

    const kids = Array.from(root.children) as HTMLElement[];
    const targets = kids.filter((el) => !skip(el.getAttribute("class") || ""));
    targets.forEach((el) => el.classList.add("anim-reveal"));

    // Лёгкий каскад для блоков, уже видимых при загрузке (первый экран)
    let firstScreen = 0;
    targets.forEach((el) => {
      const top = el.offsetTop * scale;
      if (top < window.innerHeight) {
        el.style.transitionDelay = `${firstScreen * 0.09}s`;
        firstScreen++;
      }
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("anim-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    targets.forEach((el) => io.observe(el));

    // --- Навигация и CTA: плавный скролл к разделам / форме ---
    const HEADER = 110;
    const scrollToEl = (el?: HTMLElement | null) => {
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - HEADER;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    };
    const allP = Array.from(root.querySelectorAll<HTMLElement>("p"));
    const findP = (pred: (p: HTMLElement) => boolean) => allP.find(pred);
    const anchors: Record<string, () => HTMLElement | null | undefined> = {
      jobs: () => findP((p) => p.textContent!.trim() === "Хочу работать" && !!p.closest('[class*="text-[70px]"]')),
      benefits: () => findP((p) => p.textContent!.includes("Почему выбирают")),
      faq: () => findP((p) => p.textContent!.includes("отвечаем на вопросы")) || findP((p) => p.textContent!.trim().startsWith("FAQ")),
      contacts: () =>
        findP(
          (p) =>
            p.textContent!.trim() === "Контакты" &&
            !p.closest('[class*="rounded-[61.901px]"]')
        ),
    };
    const navMap: Record<string, string> = {
      "Кем работать": "jobs",
      Преимущества: "benefits",
      FAQ: "faq",
      Контакты: "contacts",
    };
    const ctaTexts = ["хочу работать", "Хочу работать", "Оставить заявку"];

    allP.forEach((p) => {
      const t = p.textContent!.trim();
      if (navMap[t]) {
        const btn = (p.closest('[class*="rounded-[61.901px]"]') as HTMLElement) || p.parentElement;
        if (btn) {
          btn.style.cursor = "pointer";
          btn.addEventListener("click", () => scrollToEl(anchors[navMap[t]]()));
        }
        return;
      }
      if (ctaTexts.includes(t)) {
        const btn = (p.closest('[class*="rounded-["]') as HTMLElement) || p.parentElement;
        // не превращаем крупный заголовок раздела «Хочу работать» в кнопку
        if (btn && !p.closest('[class*="text-[70px]"]')) {
          btn.style.cursor = "pointer";
          btn.addEventListener("click", () => scrollToEl(anchors.contacts()));
        }
      }
    });
    root.querySelector(".rso-bell")?.addEventListener("click", () => scrollToEl(anchors.contacts()));

    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={outerRef}
      style={{ width: "100%", height: BASE_H * scale, overflow: "hidden" }}
    >
      <div
        ref={canvasRef}
        style={{
          width: BASE_W,
          height: BASE_H,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        <Desktop />
      </div>
    </div>
  );
}
