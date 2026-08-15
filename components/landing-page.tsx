const Contact = memo(function Contact() {
  const [errors, setErrors] = useState<ContactErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmissionRef = useRef(0);
  const cooldownTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (cooldownTimerRef.current !== null) window.clearTimeout(cooldownTimerRef.current);
  }, []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formTarget = event.currentTarget;
    const form = new FormData(formTarget);
    const honeypot = sanitizeSingleLine(form.get("website"), 120);
    const now = Date.now();

    if (honeypot) {
      setErrors({ form: "Não foi possível processar o envio." });
      return;
    }
    if (isSubmitting || now - lastSubmissionRef.current < FORM_COOLDOWN_MS) {
      setErrors({ form: "Aguarde alguns segundos antes de enviar novamente." });
      return;
    }

    const validated = validateContactForm(form);
    if (Object.keys(validated.errors).length > 0) {
      setErrors(validated.errors);
      return;
    }

    lastSubmissionRef.current = now;
    setErrors({});
    setIsSubmitting(true);

    try {
      // SALVANDO EXATAMENTE COM OS CAMPOS QUE O SEU CRM ESPERA
      await addDoc(collection(db, 'leads'), {
        cliente_id: "nexo-web-studio",
        nome: validated.values.name,
        email: validated.values.email,
        telefone: validated.values.phone,
        mensagem: validated.values.message,
        status: 'novo',
        createdAt: serverTimestamp()
      });
      alert("Mensagem enviada com sucesso!");
      formTarget.reset();
    } catch (err) {
      console.error("Erro ao salvar no Firestore:", err);
      setErrors({ form: "Erro ao enviar a mensagem. Tente novamente." });
    }

    cooldownTimerRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      cooldownTimerRef.current = null;
    }, FORM_COOLDOWN_MS);
  }, [isSubmitting]);

  return (
    <section id="contato" className="deferred-section section-shell py-20 md:py-28">
      <div className="glass-card relative overflow-hidden rounded-3xl p-5 sm:p-8 lg:p-12">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-accent/20 blur-[100px]" />
        <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
          <Reveal direction="left" className="relative z-10">
            <p className="eyebrow">Vamos conversar</p>
            <h2 className="mt-5 font-display text-4xl leading-tight tracking-[-0.03em] md:text-6xl">Pronto para dar o <span className="gradient-text">próximo passo?</span></h2>
            <p className="mt-6 text-sm leading-7 text-muted sm:text-base sm:leading-8">Preencha os campos abaixo ou entre em contato diretamente pelo WhatsApp para agendar uma consulta.</p>
            <div className="mt-8 rounded-3xl border border-[#25D366]/25 bg-[#25D366]/8 p-5 sm:p-6">
              <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-[#25D366] text-white"><FaWhatsapp className="size-6" aria-hidden="true" /></div><div><p className="font-display text-lg">Prefere falar agora?</p><p className="text-[11px] text-muted sm:text-xs">Resposta rápida pelo WhatsApp</p></div></div>
              <a href={whatsappUrl("Olá! Preenchi o formulário no site e quero agendar uma consulta.")} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 text-xs font-bold text-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#25D366]/20 sm:text-sm"><CalendarCheck className="size-4" aria-hidden="true" />Agendar consulta agora</a>
              <p className="mt-4 text-center text-[11px] font-bold text-white/70">WhatsApp Business: (21) 99118-2709</p>
            </div>
          </Reveal>
          <Reveal direction="right" className="relative z-10">
            <form onSubmit={handleSubmit} className="relative grid gap-5" aria-label="Formulário de contato" noValidate>
              <div className="pointer-events-none absolute left-[-10000px] top-auto size-px overflow-hidden opacity-0" aria-hidden="true">
                <label>Não preencha este campo<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-xs font-bold text-white/80">Nome completo<input className="form-field" type="text" name="name" autoComplete="name" placeholder="Como podemos chamar você?" minLength={2} maxLength={80} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} required />{errors.name ? <span id="name-error" className="form-error">{errors.name}</span> : null}</label>
                <label className="grid gap-2 text-xs font-bold text-white/80">E-mail<input className="form-field" type="email" name="email" autoComplete="email" inputMode="email" placeholder="voce@empresa.com" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} required />{errors.email ? <span id="email-error" className="form-error">{errors.email}</span> : null}</label>
              </div>
              <label className="grid gap-2 text-xs font-bold text-white/80">Telefone / WhatsApp<input className="form-field" type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="(00) 00000-0000" maxLength={20} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} required />{errors.phone ? <span id="phone-error" className="form-error">{errors.phone}</span> : null}</label>
              <label className="grid gap-2 text-xs font-bold text-white/80">Mensagem / Necessidade<textarea className="form-field min-h-36 resize-y" name="message" placeholder="Conte brevemente sobre seu projeto, objetivo ou desafio..." minLength={10} maxLength={1_000} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} required />{errors.message ? <span id="message-error" className="form-error">{errors.message}</span> : null}</label>
              <button type="submit" disabled={isSubmitting} className="cta-primary inline-flex w-full items-center justify-center gap-2 px-6 py-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"><Send className="size-4" aria-hidden="true" />{isSubmitting ? "Enviando..." : "Enviar mensagem"}</button>
              {errors.form ? <p role="alert" className="text-center text-[11px] font-bold leading-5 text-red-300">{errors.form}</p> : null}
              <p className="text-center text-[10px] leading-5 text-muted">Os dados são validados e enviados com segurança.</p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
});
