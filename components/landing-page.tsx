"use client";

import Image from "next/image";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Gauge,
  LayoutTemplate,
  MapPin,
  MessageCircle,
  PanelsTopLeft,
  Quote,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import { FaGoogle, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { memo, useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Topography from "./Topography";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const whatsappBase = "https://wa.me/5521991182709";
const googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=Rua%20Carolina%20Ferreira%2C%20192";
const instagramUrl = "https://www.instagram.com/nexowebstudio.ofc/";
const FORM_COOLDOWN_MS = 8_000;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,79}$/u;
const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,185}\.[A-Za-z]{2,24}$/;

type ContactField = "name" | "email" | "phone" | "message" | "form";
type ContactErrors = Partial<Record<ContactField, string>>;
type ContactValues = Record<Exclude<ContactField, "form">, string>;

function whatsappUrl(message: string) {
  return `${whatsappBase}?text=${encodeURIComponent(message)}`;
}

function stripControlCharacters(value: string) {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return code === 9 || code === 10 || (code >= 32 && code !== 127) ? character : "";
  }).join("");
}

function sanitizeSingleLine(value: FormDataEntryValue | null, maxLength: number) {
  return stripControlCharacters(String(value ?? "").normalize("NFKC"))
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeMessage(value: FormDataEntryValue | null) {
  return stripControlCharacters(String(value ?? "").normalize("NFKC"))
    .replace(/\r\n?/g, "\n")
    .replace(/[<>]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1_000);
}

function validateContactForm(form: FormData): { errors: ContactErrors; values: ContactValues } {
  const values = {
    name: sanitizeSingleLine(form.get("name"), 80),
    email: sanitizeSingleLine(form.get("email"), 254).toLowerCase(),
    phone: sanitizeSingleLine(form.get("phone"), 20),
    message: sanitizeMessage(form.get("message")),
  };
  const errors: ContactErrors = {};
  const phoneDigits = values.phone.replace(/\D/g, "");

  if (!NAME_PATTERN.test(values.name)) errors.name = "Informe um nome válido com pelo menos 2 caracteres.";
  if (!EMAIL_PATTERN.test(values.email)) errors.email = "Informe um e-mail válido.";
  if (phoneDigits.length < 10 || phoneDigits.length > 13) errors.phone = "Informe um telefone com DDD válido.";
  if (values.message.length < 10) errors.message = "Descreva sua necessidade em pelo menos 10 caracteres.";

  return { errors, values };
}

function Reveal({
  children,
  direction = "left",
  className,
  delay = 0,
}: {
  children: ReactNode;
  direction?: "left" | "right";
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.18 });
  const reduceMotion = useReducedMotion();
  const offset = direction === "left" ? -72 : 72;

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={reduceMotion ? { x: 0, opacity: 1 } : { x: isInView ? 0 : offset, opacity: isInView ? 1 : 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`motion-reveal ${className ?? ""}`.trim()}
    >
      {children}
    </motion.div>
  );
}

function Spotlight() {
  const pointerX = useMotionValue(-300);
  const pointerY = useMotionValue(-300);
  const x = useSpring(pointerX, { stiffness: 90, damping: 24, mass: 0.7 });
  const y = useSpring(pointerY, { stiffness: 90, damping: 24, mass: 0.7 });
  const reduceMotion = useReducedMotion();
  const frameRef = useRef<number | null>(null);
  const latestPointer = useRef({ x: -300, y: -300 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (min-width: 768px)");
    if (reduceMotion || !finePointer.matches) return;

    const handlePointer = (event: PointerEvent) => {
      latestPointer.current = { x: event.clientX - 190, y: event.clientY - 190 };
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        pointerX.set(latestPointer.current.x);
        pointerY.set(latestPointer.current.y);
        frameRef.current = null;
      });
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointer);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [pointerX, pointerY, reduceMotion]);

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-30 hidden size-[380px] rounded-full opacity-60 blur-3xl [will-change:transform] md:block"
      style={{
        x,
        y,
        background: "radial-gradient(circle, rgba(8,191,245,.17), rgba(109,40,255,.07) 48%, transparent 72%)",
      }}
    />
  );
}

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Sobre", href: "#sobre" },
  { label: "Serviços", href: "#servicos" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Contato", href: "#contato" },
];

const DynamicIsland = memo(function DynamicIsland() {
  const reduceMotion = useReducedMotion();

  return (
    <header className="pointer-events-none fixed left-1/2 top-3 z-50 w-[calc(100%-1rem)] max-w-fit -translate-x-1/2 sm:top-4">
      <motion.div
        initial={reduceMotion ? false : { y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        className="dynamic-island-surface pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/12 bg-[#030717]/55 p-1 shadow-2xl shadow-black/30 backdrop-blur-xl [will-change:transform]"
      >
      <a
        href="#inicio"
        aria-label="Ir para o início"
        className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary via-secondary to-accent font-display text-xs text-white shadow-lg shadow-primary/25 sm:size-9"
      >
        N
      </a>
      <nav aria-label="Navegação principal" className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max items-center gap-0">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="block rounded-full px-2 py-1.5 text-[9px] text-white/65 transition hover:bg-white/8 hover:text-white sm:text-[10px]">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a
        href={whatsappUrl("Olá! Vim pelo site e gostaria de solicitar um orçamento.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Solicitar orçamento pelo WhatsApp"
        className="cta-primary flex shrink-0 items-center gap-1 !rounded-full px-3 py-2 text-[9px] font-bold text-white sm:px-4 sm:text-[10px]"
      >
        <span>Orçamento</span>
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </a>
      </motion.div>
    </header>
  );
});

function Hero() {
  return (
    <section id="inicio" className="relative flex min-h-screen items-center overflow-hidden pb-20 pt-28 sm:pt-32 md:pb-24">
      <div className="pointer-events-none absolute inset-0">
        <Topography
          lowColor="#4800ff"
          midColor="#110b59"
          highColor="#ffffff"
          speed={0.35}
          morphAmount={3}
          morphSpeed={0.05}
          bands={2}
          thickness={0.01}
          scale={1}
          pixelSize={1}
          glow={0.5}
          colorMode="elevation"
          contrast={3}
          brightness={1}
          fillBands={false}
          opacity={0.8}
          grain
          grainIntensity={0.05}
          mouseInteraction
          mouseRadius={0.3}
          mouseStrength={0.4}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(3,7,23,.36),rgba(3,7,23,.86)_72%),linear-gradient(to_bottom,rgba(3,7,23,.18),#030717_100%)]" />
      <div className="section-shell relative z-10 flex justify-center">
        <Reveal direction="left" className="flex max-w-5xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/45 px-4 py-2 text-[10px] font-bold tracking-wide text-primary backdrop-blur-md sm:text-xs">
            <Sparkles className="size-3.5" aria-hidden="true" />
            ESTRATÉGIA DIGITAL QUE CONVERTE
          </div>
          <h1 className="max-w-5xl font-display text-[clamp(2.35rem,5.2vw,4.6rem)] leading-[1.06] tracking-[-0.035em]">
            Transforme desafios em <span className="gradient-text">resultados extraordinários</span> com soluções sob medida.
          </h1>
          <p className="mt-7 max-w-3xl text-sm leading-7 text-muted sm:text-base sm:leading-8 md:text-lg">
            Impulsione o seu negócio com uma metodologia comprovada, atendimento exclusivo e foco absoluto na sua performance.
          </p>
          <div className="mt-9 flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row">
            <a href={whatsappUrl("Olá! Quero falar com um especialista.")} target="_blank" rel="noopener noreferrer" className="cta-primary inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold text-white sm:text-sm">
              <MessageCircle className="size-4" aria-hidden="true" />
              Falar com o especialista
            </a>
            <a href="#servicos" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-background/45 px-6 py-4 text-xs font-bold text-white backdrop-blur-md transition hover:border-primary/35 hover:bg-background/70 sm:text-sm">
              Conhecer soluções
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50 sm:text-xs">
            <span>Design estratégico</span><span>Alta performance</span><span>Foco em conversão</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function About() {
  const pillars = ["Integridade em cada decisão", "Visão estratégica de longo prazo", "Compromisso com resultados"];
  return (
    <section id="sobre" className="deferred-section theme-light relative bg-[linear-gradient(145deg,#f8fbff,#dfeaff_55%,#eee8ff)] py-20 text-[#030717] shadow-[inset_0_1px_0_rgba(255,255,255,.9),inset_0_-1px_0_rgba(3,7,23,.08)] md:py-28">
      <div className="section-shell grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-20">
        <Reveal direction="left">
          <p className="eyebrow">Nossa essência</p>
          <h2 className="mt-5 max-w-xl font-display text-4xl leading-tight tracking-[-0.03em] md:text-6xl">A jornada por trás do <span className="gradient-text">sucesso.</span></h2>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-[#3d4a68] sm:text-base sm:leading-8 md:text-lg">Fundada por quem viveu na pele os desafios do mercado, nossa empresa nasceu com o propósito claro de entregar excelência e inovação. Sob a liderança do nosso CEO, transformamos ideias em operações de alto rendimento, construindo uma trajetória pautada pela integridade, visão estratégica e compromisso inegociável com os resultados dos nossos clientes.</p>
          <ul className="mt-8 grid gap-3">{pillars.map((pillar) => <li key={pillar} className="flex items-center gap-3 text-xs font-bold text-[#101a35] sm:text-sm"><CheckCircle2 className="size-5 shrink-0 text-secondary" aria-hidden="true" />{pillar}</li>)}</ul>
        </Reveal>
        <Reveal direction="right">
          <div className="relative mx-auto max-w-lg pl-4 pt-4 sm:pl-5 sm:pt-5">
            <div className="absolute left-0 top-0 h-[76%] w-[62%] rounded-bl-3xl rounded-tl-3xl border-y border-l border-primary/55 shadow-[0_0_48px_rgba(8,191,245,.17)]" />
            <div className="relative overflow-hidden rounded-3xl rounded-tr-[4rem] bg-surface shadow-2xl shadow-accent/10 sm:rounded-tr-[5rem]">
              <Image src="/jean-lucas-ceo.png" alt="Jean Lucas de Oliveira do Carmo, fundador e CEO da Nexo Web Studio" width={1024} height={1456} sizes="(max-width: 1024px) 100vw, 45vw" className="aspect-[4/5] w-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030717] via-transparent to-primary/8" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-5 sm:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary sm:text-xs">Fundador & CEO</p><p className="mt-1 max-w-[15rem] font-display text-lg leading-tight sm:text-xl"><span className="bg-gradient-to-r from-primary via-[#3988ff] to-accent bg-clip-text text-transparent">Jean Lucas de Oliveira</span><span className="text-white"> do Carmo</span></p></div><div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/15 bg-black/35 backdrop-blur-md sm:size-12"><Quote className="size-5 text-primary" aria-hidden="true" /></div></div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const services = [
  { icon: LayoutTemplate, title: "Landing Pages Estratégicas", description: "Páginas rápidas, persuasivas e construídas para transformar tráfego em oportunidades reais de negócio.", message: "Olá! Tenho interesse em uma Landing Page." },
  { icon: PanelsTopLeft, title: "Sites Institucionais", description: "Uma presença digital que traduz sua autoridade, diferencia sua marca e conduz o cliente até a decisão.", message: "Olá! Tenho interesse em um Site Institucional." },
  { icon: Gauge, title: "Performance & Otimização", description: "Velocidade, experiência e melhoria contínua para extrair mais resultado de cada interação digital.", message: "Olá! Quero melhorar a performance do meu site." },
];

const ServiceCard = memo(function ServiceCard({ service, index }: { service: (typeof services)[number]; index: number }) {
  const Icon = service.icon;
  return (
    <Reveal direction={index % 2 === 0 ? "left" : "right"} delay={index * 0.06}>
      <article className="interactive-card service-card glass-card group relative flex min-h-[340px] flex-col overflow-hidden rounded-3xl p-6 transition duration-300 hover:-translate-y-2 hover:scale-[1.03] sm:min-h-[370px] md:p-8">
        <div className="relative z-10 flex items-start justify-between"><div className="grid size-14 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary transition duration-300 group-hover:bg-primary group-hover:text-background"><Icon className="size-6" aria-hidden="true" /></div><span className="font-display text-sm text-white/25">0{index + 1}</span></div>
        <div className="relative z-10 mt-auto"><h3 className="font-display text-2xl tracking-tight">{service.title}</h3><p className="mt-4 text-xs leading-6 text-muted sm:text-sm sm:leading-7">{service.description}</p><a href={whatsappUrl(service.message)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-primary sm:text-sm">Explorar solução<ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" /></a></div>
      </article>
    </Reveal>
  );
});

function Services() {
  return (
    <section id="servicos" className="deferred-section section-shell py-20 md:py-28">
      <Reveal direction="left" className="max-w-3xl">
        <p className="eyebrow">O que fazemos</p>
        <h2 className="mt-5 font-display text-4xl leading-tight tracking-[-0.03em] md:text-6xl">Soluções que conectam <span className="gradient-text">marca e resultado.</span></h2>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-muted sm:text-base sm:leading-8 md:text-lg">Cada projeto combina clareza estratégica, design memorável e tecnologia de alta performance para acelerar o seu próximo nível.</p>
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {services.map((service, index) => <ServiceCard key={service.title} service={service} index={index} />)}
      </div>
      <Reveal direction="right" className="mt-12 flex justify-center">
        <a href={whatsappUrl("Olá! Gostaria de um orçamento personalizado.")} target="_blank" rel="noopener noreferrer" className="cta-primary inline-flex items-center justify-center gap-2 px-7 py-4 text-center text-xs font-bold text-white sm:text-sm">Solicitar orçamento personalizado<ArrowUpRight className="size-4" aria-hidden="true" /></a>
      </Reveal>
    </section>
  );
}

const reviews = [
  { name: "Ricardo M.", initials: "RM", color: "from-cyan-400 to-blue-600", review: "Atendimento impecável! Superou todas as nossas expectativas e entregou o projeto antes do prazo." },
  { name: "Ana Paula S.", initials: "AP", color: "from-violet-400 to-fuchsia-600", review: "A melhor decisão que tomamos para nossa empresa. O retorno sobre o investimento foi imediato." },
  { name: "Carlos Eduardo", initials: "CE", color: "from-blue-400 to-indigo-700", review: "Profissionalismo raro de se encontrar hoje em dia. Recomendo de olhos fechados!" },
];
const reviewLoop = [...reviews, ...reviews];
const fiveStars = [0, 1, 2, 3, 4] as const;

const ReviewCard = memo(function ReviewCard({ review, decorative = false }: { review: (typeof reviews)[number]; decorative?: boolean }) {
  return (
    <article aria-hidden={decorative ? true : undefined} className="interactive-card review-card-light group relative flex w-[min(84vw,390px)] shrink-0 flex-col rounded-3xl p-5 transition duration-300 hover:-translate-y-2 hover:border-secondary/35 hover:shadow-[0_22px_65px_rgba(23,92,255,.16)] sm:p-6">
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${review.color} text-xs font-bold text-white shadow-lg`}>{review.initials}</div>
        <div className="min-w-0 flex-1"><h3 className="truncate font-display text-lg">{review.name}</h3><div aria-label="Avaliação: 5 de 5 estrelas" className="mt-1 flex gap-0.5">{fiveStars.map((star) => <Star key={star} className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />)}</div></div>
        <div className="grid size-9 place-items-center rounded-full bg-white text-[#4285F4]"><FaGoogle className="size-4" aria-hidden="true" /></div>
      </div>
      <p className="mt-5 flex-1 text-xs leading-6 text-[#3d4a68] sm:text-sm sm:leading-7">“{review.review}”</p>
      <div className="mt-5 flex items-center gap-1.5 border-t border-[#030717]/8 pt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-secondary"><BadgeCheck className="size-4" aria-hidden="true" />Google Review</div>
    </article>
  );
});

function Testimonials() {
  return (
    <section id="depoimentos" className="deferred-section theme-light bg-[linear-gradient(145deg,#eef5ff,#ffffff_48%,#e8e1ff)] py-20 text-[#030717] shadow-[inset_0_1px_0_rgba(255,255,255,.9),inset_0_-1px_0_rgba(3,7,23,.08)] md:py-28">
      <div className="section-shell">
        <Reveal direction="left" className="max-w-3xl">
          <p className="eyebrow">Avaliações no Google</p>
          <h2 className="mt-5 font-display text-4xl leading-tight tracking-[-0.03em] md:text-6xl">Experiências que viram <span className="gradient-text">recomendação.</span></h2>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#3d4a68] sm:text-base sm:leading-8 md:text-lg">Parcerias construídas com clareza, cuidado e compromisso — do primeiro contato à entrega final.</p>
        </Reveal>
      </div>
      <div className="review-marquee mt-12 overflow-hidden py-5" role="region" aria-label="Avaliações de clientes">
        <div className="review-track flex gap-5 px-3">
          {reviewLoop.map((review, index) => <ReviewCard key={`${review.name}-${index}`} review={review} decorative={index >= reviews.length} />)}
        </div>
      </div>
      <div className="section-shell mt-8 flex justify-center">
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-[#030717]/12 bg-white/70 px-5 py-3 text-xs font-bold text-[#030717] shadow-sm transition hover:border-secondary/35 hover:bg-white sm:text-sm"><FaGoogle className="size-4 text-[#4285F4]" aria-hidden="true" />Ver no Google Maps<ArrowUpRight className="size-4" aria-hidden="true" /></a>
      </div>
    </section>
  );
}

const Contact = memo(function Contact() {
  const [errors, setErrors] = useState<ContactErrors>({});
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const lastSubmissionRef = useRef(0);
  const cooldownTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (cooldownTimerRef.current !== null) window.clearTimeout(cooldownTimerRef.current);
  }, []);

  // ID DO CLIENTE (Substitua pelo ID que você pegou no CRM):
  const CLIENT_ID = "3EQx6sXtRzWmGpvhGPQeXAsBXOI3";

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const honeypot = sanitizeSingleLine(form.get("website"), 120);
    const now = Date.now();

    if (honeypot) {
      setErrors({ form: "Não foi possível processar o envio. Atualize a página e tente novamente." });
      return;
    }
    if (isCoolingDown || now - lastSubmissionRef.current < FORM_COOLDOWN_MS) {
      setErrors({ form: "Aguarde alguns segundos antes de enviar novamente." });
      return;
    }

    const validated = validateContactForm(form);
    if (Object.keys(validated.errors).length > 0) {
      setErrors(validated.errors);
      return;
    }

    const { name, email, phone, message: need } = validated.values;

    // === ENVIO AUTOMÁTICO PARA O SEU NX CRM ===
    try {
      await addDoc(collection(db, "leads"), {
        userId: CLIENT_ID,            // Identifica de quem é este lead
        nome: name,                   // Nome digitado
        email: email,                 // E-mail digitado
        telefone: phone,              // WhatsApp digitado
        mensagem: need,               // Mensagem digitada
        origem: "Landing Page",       // Identificador
        status: "Novo",               // Cor do funil (Roxo/Novo)
        createdAt: serverTimestamp()  // Data/hora atual
      });
    } catch (error) {
      console.error("Erro ao salvar lead no CRM:", error);
    }

    // === FLUXO ORIGINAL DO WHATSAPP (MANTIDO) ===
    const message = `Olá! Preenchi o formulário no site e quero iniciar uma conversa.\n\nNome: ${name}\nE-mail: ${email}\nTelefone/WhatsApp: ${phone}\nNecessidade: ${need}`;
    lastSubmissionRef.current = now;
    setErrors({});
    setIsCoolingDown(true);
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
    cooldownTimerRef.current = window.setTimeout(() => {
      setIsCoolingDown(false);
      cooldownTimerRef.current = null;
    }, FORM_COOLDOWN_MS);
  }, [isCoolingDown]);

function Footer() {
  return (
    <footer className="deferred-section border-t border-white/8 pb-24 pt-10 sm:pb-10">
      <div className="section-shell grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[.035] p-6 sm:p-8">
          <div className="flex items-center gap-4"><Image src="/nexo-logo.png" alt="Nexo Web Studio" width={64} height={64} className="size-14 rounded-2xl object-cover" /><div><p className="font-display text-2xl">Nexo Web Studio</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-primary">Estratégia • Design • Performance</p></div></div>
          <p className="mt-6 max-w-md text-xs leading-6 text-muted sm:text-sm sm:leading-7">Soluções digitais sob medida para empresas que querem crescer com clareza, autoridade e performance.</p>
          <address className="mt-6 grid gap-3 text-xs not-italic leading-6 text-white/70 sm:text-sm">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 transition hover:text-primary"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>Rua Carolina Ferreira, 192</span></a>
            <p className="flex items-center gap-3"><PanelsTopLeft className="size-4 shrink-0 text-primary" aria-hidden="true" /><span>Atendimento Web</span></p>
            <a href={whatsappUrl("Olá! Vim pelo site da Nexo Web Studio e gostaria de mais informações.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 transition hover:text-[#25D366]"><FaWhatsapp className="size-4 shrink-0 text-[#25D366]" aria-hidden="true" /><span>WhatsApp Business: (21) 99118-2709</span></a>
          </address>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir Instagram da Nexo Web Studio" className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:border-primary/40 hover:text-primary"><FaInstagram className="size-5" aria-hidden="true" /></a>
            <a href="https://www.linkedin.com/search/results/companies/?keywords=Nexo%20Web%20Studio" target="_blank" rel="noopener noreferrer" aria-label="Buscar Nexo Web Studio no LinkedIn" className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:border-primary/40 hover:text-primary"><FaLinkedinIn className="size-5" aria-hidden="true" /></a>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Abrir localização no Google Maps" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-white transition hover:border-primary/40 hover:text-primary"><MapPin className="size-4" aria-hidden="true" />Google Maps</a>
          </div>
          <nav aria-label="Links do rodapé" className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-[11px] text-white/55">{navLinks.map((link) => <a key={link.href} href={link.href} className="transition hover:text-primary">{link.label}</a>)}</nav>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-surface">
          <iframe title="Localização da Nexo Web Studio no Google Maps" src="https://www.google.com/maps?q=Rua+Carolina+Ferreira,+192&output=embed" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups" className="h-72 w-full border-0 grayscale-[25%] lg:h-full" />
        </div>
      </div>
      <div className="section-shell mt-8 grid gap-3 border-t border-white/8 pt-6 text-center text-[10px] leading-5 text-muted sm:grid-cols-2 sm:text-left lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <p>Nexo Web Studio. Estratégia, tecnologia e performance em um só lugar.</p>
        <p>CNPJ: 68.312.868</p>
        <p className="sm:col-span-2 lg:col-span-1">Idealizado por Jean Lucas de Oliveira do Carmo.</p>
      </div>
    </footer>
  );
}

function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl("Olá! Vim pelo site e gostaria de mais informações.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Nexo pelo WhatsApp"
      className="group fixed bottom-4 right-4 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/30 transition duration-300 [will-change:transform] hover:scale-110 sm:bottom-6 sm:right-6 sm:size-16"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/35 [animation-duration:2.4s]" />
      <FaWhatsapp className="size-7 sm:size-8" aria-hidden="true" />
    </a>
  );
}
}
export function LandingPage() {
  return (
    <main className="relative overflow-x-clip">
      <Spotlight />
      <DynamicIsland />
      <Hero />
      <About />
      <Services />
      <Testimonials />
      <Contact />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
