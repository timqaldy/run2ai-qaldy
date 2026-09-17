import Image from "next/image";
import { fileUrl, formatDate, formatPrice } from "@/lib/format";
import type { PublicState } from "@/lib/service";
import { CtaButton, TextCta } from "./Cta";

function Sticker({ src, alt, w, h }: { src: string; alt: string; w: number; h: number }) {
  return (
    <Image src={src} alt={alt} width={w} height={h} className="h-auto w-[min(62vw,260px)] -rotate-2" />
  );
}

function seatsWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "место";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "места";
  return "мест";
}

function SeatsLine({ state, className = "" }: { state: PublicState; className?: string }) {
  return (
    <p className={`font-display text-sm font-extrabold uppercase tracking-wider text-cyan ${className}`}>
      {state.soldOut
        ? "Все места заняты"
        : `Осталось ${state.seatsLeft} ${seatsWord(state.seatsLeft)} из ${state.event.capacity}`}
    </p>
  );
}

export function Hero({ state }: { state: PublicState }) {
  const { event, settings } = state;
  const hero = fileUrl(settings.hero_image_key);
  const badges = [
    { label: "Дата", value: formatDate(event.date) },
    { label: "Старт", value: event.time },
    { label: "Мест", value: String(event.capacity) },
    { label: "Цена", value: formatPrice(event.price, event.currency) },
  ];

  return (
    <section className="grunge relative mx-auto flex max-w-6xl flex-col px-4 pb-8 pt-3 md:grid md:min-h-0 md:grid-cols-2 md:items-center md:gap-10 md:px-8 md:py-16">
      <div className="relative order-2 -mt-2 md:order-1 md:mt-0">
        <h1 className="sr-only">
          Пробежка по ИИ-шкам — {event.event_type}. {event.format}
        </h1>
        <Image
          src="/brand/title.webp"
          alt=""
          width={1000}
          height={344}
          priority
          className="relative z-10 -mt-16 h-auto w-full max-w-[520px] drop-shadow-[0_6px_20px_rgba(0,0,0,.6)] md:mt-0"
        />
        <div className="relative z-10 -mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Image src="/brand/beginner.webp" alt="" width={700} height={165} priority className="h-auto w-[46%] max-w-[260px]" />
          <span className="inline-flex w-[46%] max-w-[250px] -rotate-1 items-center justify-center rounded-xl bg-white px-3 py-2 text-center font-display text-[13px] font-black uppercase italic leading-tight text-night shadow-[0_4px_0_rgba(0,0,0,.35)] min-[400px]:text-base md:text-xl">
            Online Workshop
          </span>
        </div>
        <p className="mt-1 text-base font-semibold text-white/90 md:mt-4 md:text-xl">
          <span className="text-cyan">Вайбкодинг</span> с нуля.
        </p>

        <dl className="mt-3 grid grid-cols-4 gap-1.5 md:mt-6 md:gap-3">
          {badges.map((b) => (
            <div key={b.label} className="rounded-xl border border-cyan/30 bg-deep/80 px-1.5 py-2 text-center glow md:rounded-2xl md:py-4">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-mist md:text-xs">{b.label}</dt>
              <dd className="mt-0.5 whitespace-nowrap font-display text-[13px] font-black leading-tight min-[400px]:text-sm md:text-xl">
                {b.value}
              </dd>
            </div>
          ))}
        </dl>

        <CtaButton source="hero" className="mt-4 w-full md:mt-7 md:w-auto md:min-w-80" />
        <div className="mt-2.5 flex items-center justify-between gap-3 md:justify-start md:gap-6">
          <a href="#program" className="whitespace-nowrap text-sm font-semibold text-white/80 underline decoration-cyan decoration-2 underline-offset-4">
            Что будет на тренировке?
          </a>
          <SeatsLine state={state} className="whitespace-nowrap text-[11px] min-[400px]:text-xs md:text-sm" />
        </div>
      </div>

      <div className="relative order-1 flex justify-center md:order-2">
        <div className="absolute inset-x-8 bottom-6 top-10 -z-10 rounded-full bg-electric/25 blur-3xl" aria-hidden />
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={`Организаторы: ${event.organizers}`} className="fade-bottom h-[40svh] max-h-[400px] w-auto max-w-full object-contain md:h-auto md:max-h-[640px]" />
        ) : (
          <Image
            src="/brand/duo.webp"
            alt={`Организаторы: ${event.organizers}`}
            width={941}
            height={865}
            priority
            className="fade-bottom h-[40svh] max-h-[400px] w-auto max-w-full object-contain md:h-auto md:max-h-none md:w-full"
          />
        )}
      </div>
    </section>
  );
}

export function Pitch() {
  const items = [
    { title: "С нуля", text: "Даже если вы никогда не программировали.", icon: "0→1" },
    { title: "Руками", text: "Не смотрим, как кодит преподаватель. Создаём сами.", icon: "⌨" },
    { title: "С результатом", text: "К концу тренировки у вас должен появиться работающий прототип.", icon: "✓" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-24">
      <h2 className="font-display text-4xl font-black uppercase italic leading-[0.95] md:text-6xl">
        Не курс. Не лекция. <span className="brush text-cyan">Тренировка.</span>
      </h2>
      <p className="mt-5 max-w-2xl text-lg text-mist md:text-xl">
        Берём идею и превращаем её в работающий цифровой продукт вместе с AI. Минимум теории. Максимум практики.
      </p>
      <div className="mt-8 grid gap-3 md:grid-cols-3 md:gap-5">
        {items.map((item) => (
          <article key={item.title} className="grunge rounded-3xl border border-white/10 bg-deep p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-electric/15 font-display text-lg font-black text-cyan">
              {item.icon}
            </span>
            <h3 className="mt-4 font-display text-2xl font-black uppercase italic">{item.title}</h3>
            <p className="mt-2 text-mist">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ForWhom() {
  const list = [
    "предприниматель",
    "менеджер",
    "студент",
    "эксперт",
    "хотите создавать приложения без классического программирования",
    "слышали про vibe coding, но не знаете, с чего начать",
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <Sticker src="/brand/s-dlya-kogo.webp" alt="Для кого" w={380} h={225} />
      <p className="mt-4 font-display text-2xl font-black">Подойдёт, если вы:</p>
      <ul className="mt-4 grid gap-2 md:grid-cols-2 md:gap-3">
        {list.map((item) => (
          <li key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-lg">
            <span className="mt-1 size-3 shrink-0 rotate-45 bg-electric" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      <TextCta source="for_whom">Попробовать вайбкодинг →</TextCta>
    </section>
  );
}

const TOTAL_MINUTES = 150;
const SCHEDULE = [
  { from: 0, to: 20, icon: "💡", title: "Разгон идей", text: "Проблема → 10 идей → 1 сильная идея" },
  { from: 20, to: 35, icon: "🖥️", title: "Примеры проектов", text: "Демонстрация кейсов из Project.qaldy.com" },
  { from: 35, to: 50, icon: "🎯", title: "Выбор MVP", text: "Для кого? Что делает? 3 функции максимум" },
  { from: 50, to: 110, icon: "⌨️", title: "Build Sprint", text: "Собираем первую рабочую версию вместе с AI" },
  { from: 110, to: 130, icon: "🛠️", title: "Fix + Test", text: "Исправляем ошибки и улучшаем результат" },
  { from: 130, to: TOTAL_MINUTES, icon: "🚀", title: "Deploy + Demo", text: "Публикация, ссылка и короткая демонстрация" },
];

function Schedule({ event }: { event: PublicState["event"] }) {
  return (
    <div className="mt-10">
      <p className="font-display text-2xl font-black uppercase italic md:text-3xl">
        Программа <span className="brush text-cyan">Workshop</span>
      </p>
      <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1.5 font-display text-sm font-black text-night md:text-base">
        🕐 {event.time} — {addMinutes(event.time, TOTAL_MINUTES)}
      </p>
      <ol className="relative mt-5 grid gap-3 border-l-2 border-cyan/30 pl-5 md:gap-4 md:pl-7">
        {SCHEDULE.map((step) => {
          const label = `${addMinutes(event.time, step.from)}–${addMinutes(event.time, step.to)}`;
          return (
            <li key={step.title} className="relative grunge flex items-center gap-4 rounded-2xl border border-white/10 bg-deep p-4">
              <span className="absolute -left-[27px] top-1/2 size-3 -translate-y-1/2 rounded-full bg-electric ring-4 ring-night md:-left-[35px]" aria-hidden />
              <span className="hidden shrink-0 text-3xl sm:block" aria-hidden>{step.icon}</span>
              <div className="min-w-0">
                <p className="font-display text-sm font-black text-cyan md:text-base">{label}</p>
                <p className="font-display text-lg font-black md:text-xl">{step.title}</p>
                <p className="text-sm text-mist md:text-base">{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-300/40 bg-amber-400/10 px-4 py-3 font-display text-sm font-black uppercase md:text-base">
        🏆 Идея → MVP → Ссылка ·{" "}
        <span className="text-amber-300">Результат: свой первый работающий AI-продукт</span>
      </p>
    </div>
  );
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function Program({ state }: { state: PublicState }) {
  const track = ["IDEA", "PROMPT", "AI", "CODE", "MVP"];
  const steps = [
    "Формулируем идею.",
    "Создаём правильное задание AI.",
    "Запускаем coding agent.",
    "Исправляем ошибки.",
    "Получаем рабочий MVP.",
  ];
  return (
    <section id="program" className="scroll-mt-4 mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <Sticker src="/brand/s-chto-budet.webp" alt="Что будет" w={350} h={202} />
      <div className="mt-6 flex items-center gap-0.5 overflow-x-auto pb-2 min-[400px]:gap-1 md:gap-3" aria-hidden>
        {track.map((t, i) => (
          <div key={t} className="flex items-center gap-0.5 min-[400px]:gap-1 md:gap-3">
            <span className="whitespace-nowrap rounded-lg border border-cyan/40 bg-deep px-1.5 py-1.5 font-display text-[11px] font-black text-glow min-[400px]:px-2.5 min-[400px]:text-sm md:rounded-xl md:px-6 md:py-2 md:text-2xl">
              {t}
            </span>
            {i < track.length - 1 ? <span className="font-black text-electric">→</span> : null}
          </div>
        ))}
      </div>
      <ol className="mt-6 grid gap-3 md:grid-cols-5">
        {steps.map((step, i) => (
          <li key={step} className="grunge flex gap-4 rounded-2xl border border-white/10 bg-deep p-4 md:flex-col md:gap-3">
            <span className="font-display text-4xl font-black italic leading-none text-electric">{i + 1}</span>
            <span className="text-lg font-semibold">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-8 font-display text-3xl font-black uppercase italic md:text-5xl">
        Вы не смотрите. <span className="brush text-cyan">Вы делаете.</span>
      </p>
      <Schedule event={state.event} />
    </section>
  );
}

export function Pricing({ state }: { state: PublicState }) {
  const { event } = state;
  const includes = ["участие", "практика", "материалы", "помощь во время работы", "доступ в комьюнити", "собственный MVP"];
  return (
    <section id="price" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-12 md:px-8 md:py-20">
      <div className="grunge overflow-hidden rounded-[2rem] border border-cyan/40 bg-gradient-to-br from-panel via-deep to-night p-6 glow md:grid md:grid-cols-2 md:gap-10 md:p-12">
        <div>
          <p className="font-display text-lg font-black uppercase italic text-cyan">
            {event.name} — {event.event_type}
          </p>
          <p className="mt-2 font-display text-6xl font-black leading-none text-glow md:text-8xl">
            {formatPrice(event.price, event.currency)}
          </p>
          <p className="mt-3 text-lg text-mist">По цене одной тренировки.</p>
          <p className="mt-6 inline-flex rounded-full bg-electric/15 px-4 py-2 font-display font-black uppercase">
            Всего {event.capacity} мест
          </p>
          <SeatsLine state={state} className="mt-3" />
        </div>
        <div className="mt-8 md:mt-0">
          <p className="font-bold uppercase tracking-widest text-mist">Что входит</p>
          <ul className="mt-3 grid gap-2">
            {includes.map((item) => (
              <li key={item} className="flex items-center gap-3 text-lg">
                <span className="grid size-6 place-items-center rounded-full bg-electric text-xs font-black text-night">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <CtaButton source="pricing" label="Забронировать место" withPrice className="mt-7 w-full" />
        </div>
      </div>
    </section>
  );
}

export function Organizers({ state }: { state: PublicState }) {
  const { event } = state;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <Sticker src="/brand/s-kto-vedet.webp" alt="Кто ведёт" w={370} h={222} />
      <div className="mt-6 grid items-center gap-6 md:grid-cols-[1fr_1.2fr]">
        <p className="font-display text-5xl font-black uppercase italic leading-none md:text-7xl">
          {event.organizers.split("+").map((name, i, all) => (
            <span key={name} className="block">
              {name.trim()}
              {i < all.length - 1 ? <span className="text-electric"> +</span> : null}
            </span>
          ))}
        </p>
        <div className="rounded-3xl border border-white/10 bg-deep p-6 text-lg text-mist">
          <p>
            {event.format}. Формат {event.event_type.toLowerCase()} — для тех, кто стартует с нуля.
          </p>
        </div>
      </div>
    </section>
  );
}

const VIDEO_TESTIMONIAL = { src: "/video/otzyv.mp4", poster: "/video/otzyv-poster.jpg" };

function VideoTestimonial() {
  return (
    <div className="mx-auto max-w-xs">
      <video
        src={VIDEO_TESTIMONIAL.src}
        poster={VIDEO_TESTIMONIAL.poster}
        controls
        playsInline
        preload="metadata"
        className="aspect-[9/16] w-full rounded-3xl border border-white/10 bg-black object-cover glow"
      >
        Ваш браузер не поддерживает видео.
      </video>
      <p className="mt-3 text-center text-sm text-mist">Видео-отзыв участника тренировки</p>
    </div>
  );
}

export function Testimonials({ state }: { state: PublicState }) {
  if (!state.testimonials.length && !VIDEO_TESTIMONIAL.src) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
      <h2 className="font-display text-4xl font-black uppercase italic">Отзывы</h2>
      <VideoTestimonial />
      {state.testimonials.length ? (
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {state.testimonials.map((t) => (
          <figure key={t.id} className="rounded-3xl border border-white/10 bg-deep p-6">
            <div className="flex items-center gap-3">
              {t.photo_key ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(t.photo_key) ?? ""} alt="" className="size-14 rounded-full border-2 border-electric object-cover" />
              ) : null}
              <div>
                <figcaption className="font-bold">{t.name}</figcaption>
                <p className="text-cyan" aria-label={`Оценка ${t.rating} из 5`}>
                  {"★".repeat(t.rating)}
                  <span className="text-white/20">{"★".repeat(5 - t.rating)}</span>
                </p>
              </div>
            </div>
            <blockquote className="mt-4 text-mist">“{t.quote}”</blockquote>
          </figure>
        ))}
      </div>
      ) : null}
    </section>
  );
}

export function FinalCta({ state }: { state: PublicState }) {
  const { event } = state;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-32 pt-10 text-center md:px-8 md:pb-24">
      <div className="flex justify-center">
        <Image src="/brand/s-zapis.webp" alt="Запись" width={400} height={123} className="h-auto w-[min(70vw,300px)]" />
      </div>
      <p className="mx-auto mt-4 max-w-xl text-lg text-mist">
        {formatDate(event.date)} в {event.time}. Адрес: {event.address}.
      </p>
      <CtaButton source="final" withPrice className="mt-6 w-full md:w-auto md:min-w-96" />
      <SeatsLine state={state} className="mt-3" />
    </section>
  );
}

export function Footer({ whatsapp }: { whatsapp: string }) {
  return (
    <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-mist md:px-8">
      <p>© QALDY AI · Пробежка по ИИ-шкам</p>
      <p className="mt-2 flex flex-wrap justify-center gap-4">
        <a className="underline" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
        <a className="underline" href="/privacy">
          Обработка данных
        </a>
      </p>
    </footer>
  );
}
