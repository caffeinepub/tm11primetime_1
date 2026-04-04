import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronLeft,
  Crown,
  Gift,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  Receipt,
  Shield,
  Smartphone,
  User as UserIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend.d";
import {
  getActorWithRetry,
  getGlobalActor,
  normalizePhone,
} from "../globalActor";
import { usePhoneAuth } from "../hooks/usePhoneAuth";

const UPI_ID = "yespay.bizsbiz12758@yesbankltd";
const PAYMENT_AMOUNT = 118;

// ─── Types ────────────────────────────────────────────────────────────────────
type FormMode = "phone" | "checking" | "details";
type PageStep = "form" | "payment" | "success";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function humanError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (
    lower.includes("connect") ||
    lower.includes("fetch") ||
    lower.includes("network")
  )
    return "Could not connect to the server. Please check your connection and try again.";
  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("phone number already")
  )
    return "This number is already registered.";
  if (lower.includes("not functioning") || lower.includes("actor"))
    return "Service temporarily unavailable. Retrying\u2026";
  return msg || "Something went wrong. Please try again.";
}

function isAlreadyRegisteredError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("already registered") ||
    msg.includes("already exists") ||
    msg.includes("phone number already") ||
    msg.includes("not functioning") ||
    msg.includes("actor register") ||
    msg.includes("anonymous") ||
    msg.includes("cannot register") ||
    msg.includes("user exists")
  );
}

// Unwrap Motoko optional: ?User comes back as [] | [User] in JS
function unwrapOptionalUser(result: unknown): User | null {
  if (!result) return null;
  if (Array.isArray(result)) return (result[0] as User) ?? null;
  return result as User;
}

async function findUserByPhone(rawPhone: string): Promise<User | null> {
  const actor = await getActorWithRetry();
  const normalized = normalizePhone(rawPhone.trim());
  const result = await actor.getUserByPhone(normalized);
  return unwrapOptionalUser(result);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const phoneAuth = usePhoneAuth();
  const search = useSearch({ from: "/register" }) as {
    step?: string;
    ref?: string;
    phone?: string;
  };

  const initialStep = search.step === "payment" ? "payment" : "form";
  const initialRef = search.ref ?? "";
  const initialPhone = search.phone ?? "";

  const [form, setForm] = useState({
    name: phoneAuth.userName ?? "",
    email: "",
    phone: initialPhone || phoneAuth.phone || "",
    referredBy: initialRef,
  });
  const [formMode, setFormMode] = useState<FormMode>(
    phoneAuth.isLoggedIn ? "details" : initialPhone ? "checking" : "phone",
  );
  const [step, setStep] = useState<PageStep>(initialStep);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [showUtrForm, setShowUtrForm] = useState(false);
  const [utrForm, setUtrForm] = useState({
    txId: "",
    userName: phoneAuth.userName ?? "",
    phone: phoneAuth.phone ?? "",
    amount: String(PAYMENT_AMOUNT),
  });
  const [utrError, setUtrError] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [copied, setCopied] = useState(false);

  const phoneAuthRef = useRef(phoneAuth);
  phoneAuthRef.current = phoneAuth;
  const hasAutoChecked = useRef(false);

  // Auto-login if already paid
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-time mount check
  useEffect(() => {
    if (phoneAuth.isLoggedIn && initialStep !== "payment") {
      const checkUser = async () => {
        try {
          const actor = await getGlobalActor();
          const result = await actor.getUserByPhone(
            normalizePhone(phoneAuth.phone ?? ""),
          );
          const user = unwrapOptionalUser(result);
          if (user?.isPaid) {
            navigate({ to: "/dashboard" });
          } else {
            setStep("payment");
            if (user) {
              setUtrForm((p) => ({
                ...p,
                userName: user.name || p.userName,
                phone: user.phone || phoneAuth.phone || p.phone,
              }));
            }
          }
        } catch {
          // Ignore — just show form
        }
      };
      checkUser();
    }
  }, []);

  // Auto-check phone when coming from LandingPage with a phone param
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-time check on mount
  useEffect(() => {
    if (initialPhone && !hasAutoChecked.current && !phoneAuth.isLoggedIn) {
      hasAutoChecked.current = true;
      handlePhoneCheck(initialPhone);
    }
  }, []);

  // ─── Phase 1: Check phone ──────────────────────────────────────────────
  const handlePhoneCheck = async (overridePhone?: string) => {
    const raw = (overridePhone ?? form.phone).trim();
    if (!raw) {
      setError("Please enter your mobile number.");
      setFormMode("phone");
      return;
    }
    const normalized = normalizePhone(raw);
    if (normalized.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      setFormMode("phone");
      return;
    }

    setError("");
    setFormMode("checking");

    try {
      const user = await findUserByPhone(raw);
      if (user) {
        phoneAuthRef.current.login(user.phone, user.id, user.name);
        if (user.isPaid) {
          navigate({ to: "/dashboard" });
        } else {
          setUtrForm((p) => ({
            ...p,
            userName: user.name || p.userName,
            phone: user.phone || normalized,
          }));
          setStep("payment");
          setFormMode("details");
        }
      } else {
        // New user — show registration form
        setFormMode("details");
        setForm((p) => ({ ...p, phone: normalized }));
      }
    } catch (err) {
      setError(humanError(err));
      setFormMode("phone");
    }
  };

  // ─── Phase 2: Register ─────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setIsRegistering(true);
    const normalized = normalizePhone(form.phone);

    try {
      // Belt-and-suspenders: double-check not already registered
      const actor = await getActorWithRetry();
      const existingResult = await actor.getUserByPhone(normalized);
      const existing = unwrapOptionalUser(existingResult);
      if (existing) {
        phoneAuthRef.current.login(existing.phone, existing.id, existing.name);
        if (existing.isPaid) {
          navigate({ to: "/dashboard" });
          return;
        }
        setUtrForm((p) => ({
          ...p,
          userName: existing.name || form.name,
          phone: existing.phone || normalized,
        }));
        setStep("payment");
        return;
      }

      const userId = await actor.registerUser(
        form.name.trim(),
        form.email.trim(),
        normalized,
        form.referredBy.trim(),
      );
      phoneAuthRef.current.login(normalized, userId, form.name.trim());
      setUtrForm((p) => ({
        ...p,
        userName: form.name.trim(),
        phone: normalized,
      }));
      setStep("payment");
    } catch (err) {
      if (isAlreadyRegisteredError(err)) {
        // Try to recover by looking up the user
        try {
          const actor2 = await getActorWithRetry();
          const existingResult2 = await actor2.getUserByPhone(normalized);
          const existing2 = unwrapOptionalUser(existingResult2);
          if (existing2) {
            phoneAuthRef.current.login(
              existing2.phone,
              existing2.id,
              existing2.name,
            );
            if (existing2.isPaid) {
              navigate({ to: "/dashboard" });
              return;
            }
            setUtrForm((p) => ({
              ...p,
              userName: existing2.name || form.name,
              phone: existing2.phone || normalized,
            }));
            setStep("payment");
            return;
          }
        } catch {
          /* ignore */
        }
        setError(
          "This number is already registered. Please go back and enter your number to login.",
        );
        setFormMode("phone");
      } else {
        setError(humanError(err));
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // ─── Payment submission ────────────────────────────────────────────────
  const handleConfirmPayment = async () => {
    if (!utrForm.txId.trim()) {
      setUtrError("Please enter your Transaction ID / UTR number.");
      return;
    }
    if (!utrForm.phone.trim()) {
      setUtrError("Please enter the phone number used for this payment.");
      return;
    }
    setUtrError("");
    setIsSubmittingPayment(true);
    try {
      const actor = await getActorWithRetry();
      const submissionPhone = normalizePhone(utrForm.phone) || utrForm.phone;
      await actor.submitPaymentProof({
        utr: utrForm.txId.trim(),
        name: utrForm.userName.trim() || phoneAuth.userName || "Member",
        phone: submissionPhone,
        amount: utrForm.amount,
      });
      setShowUtrForm(false);
      setStep("success");
      toast.success("Payment submitted! Admin will verify shortly.");
    } catch (err) {
      setUtrError(humanError(err));
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const copyUpiToClipboard = (text: string): void => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      });
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  const copyUpi = () => {
    const text = UPI_ID;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          toast.success("UPI ID copied!");
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          const el = document.createElement("textarea");
          el.value = text;
          el.style.position = "fixed";
          el.style.opacity = "0";
          document.body.appendChild(el);
          el.focus();
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
          setCopied(true);
          toast.success("UPI ID copied!");
          setTimeout(() => setCopied(false), 2000);
        });
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      toast.success("UPI ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openUpiApp = (appName: string, url: string) => {
    copyUpiToClipboard(UPI_ID);
    toast.success(
      `UPI ID copied! Open ${appName} and paste in any payment field.`,
      { duration: 4000 },
    );
    window.open(url, "_blank");
  };

  const upiApps = [
    { name: "Google Pay", scheme: "https://pay.google.com/" },
    { name: "PhonePe", scheme: "https://phon.pe/" },
    { name: "Paytm", scheme: "https://paytm.com/" },
    { name: "BHIM UPI", scheme: "https://www.bhimupi.org.in/" },
  ];

  // ─── Render: Form Step ────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
        {/* Back to home */}
        <div className="w-full max-w-md mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="text-muted-foreground hover:text-foreground -ml-2"
            data-ocid="register.back.button"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="bg-card border-border shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display text-lg font-bold text-gradient-gold">
                  Tm11primeTime
                </span>
              </div>
              <CardTitle className="font-display text-xl">
                {formMode === "details" ? "Create Account" : "Welcome Back"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="wait">
                {formMode === "phone" || formMode === "checking" ? (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-foreground/80">
                        Mobile Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder="10-digit mobile number"
                          value={form.phone}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, phone: e.target.value }));
                            setError("");
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handlePhoneCheck()
                          }
                          disabled={formMode === "checking"}
                          className="pl-10 bg-secondary border-border"
                          data-ocid="register.phone.input"
                          autoComplete="tel"
                          autoFocus
                        />
                      </div>
                    </div>

                    {error && (
                      <div
                        className="flex items-start gap-2 text-destructive text-sm"
                        data-ocid="register.phone.error_state"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      onClick={() => handlePhoneCheck()}
                      disabled={formMode === "checking"}
                      className="w-full bg-primary text-primary-foreground font-ui font-semibold"
                      data-ocid="register.phone.submit_button"
                    >
                      {formMode === "checking" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking your account\u2026
                        </>
                      ) : (
                        <>
                          Login / Continue
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-muted-foreground">
                      Number not registered. Fill in your details to create an
                      account.
                    </p>

                    {/* Phone (read-only) */}
                    <div className="space-y-1.5">
                      <Label className="text-foreground/80">
                        Mobile Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={form.phone}
                          readOnly
                          className="pl-10 bg-secondary border-border opacity-70"
                          data-ocid="register.phone_readonly.input"
                        />
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-foreground/80">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          name="name"
                          placeholder="Your full name"
                          value={form.name}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, name: e.target.value }));
                            setError("");
                          }}
                          className="pl-10 bg-secondary border-border"
                          data-ocid="register.name.input"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-foreground/80">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="your@email.com"
                          value={form.email}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, email: e.target.value }));
                            setError("");
                          }}
                          className="pl-10 bg-secondary border-border"
                          data-ocid="register.email.input"
                        />
                      </div>
                    </div>

                    {/* Referral Code */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="referredBy"
                        className="text-foreground/80"
                      >
                        Referral Code{" "}
                        <span className="text-muted-foreground text-xs">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="referredBy"
                        name="referredBy"
                        placeholder="Enter referral code"
                        value={form.referredBy}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            referredBy: e.target.value,
                          }))
                        }
                        readOnly={!!initialRef}
                        className={`bg-secondary border-border ${
                          initialRef ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                        data-ocid="register.referral.input"
                      />
                      {initialRef && (
                        <p className="text-xs text-muted-foreground">
                          \uD83D\uDD12 Referral code locked
                        </p>
                      )}
                    </div>

                    {error && (
                      <div
                        className="flex items-start gap-2 text-destructive text-sm"
                        data-ocid="register.details.error_state"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFormMode("phone");
                          setError("");
                        }}
                        className="flex-1 border-border"
                        data-ocid="register.back_to_phone.button"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                      <Button
                        onClick={handleRegister}
                        disabled={isRegistering}
                        className="flex-1 bg-primary text-primary-foreground font-ui font-semibold"
                        data-ocid="register.submit_button"
                      >
                        {isRegistering ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Register"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── Render: Payment Step ─────────────────────────────────────────────
  if (step === "payment") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-4"
        >
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 mb-3 glow-gold">
              <IndianRupee className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold">
              Activate Membership
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Pay ₹118 via UPI to activate your account
            </p>
          </div>

          {/* Payment Card */}
          <Card className="bg-card border-border">
            <CardContent className="p-5 space-y-4">
              {/* Amount */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-muted-foreground text-sm font-ui">
                  Amount
                </span>
                <span className="font-display text-2xl font-bold text-primary">
                  ₹118
                </span>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                ₹100 + 18% GST = ₹118
              </div>

              {/* UPI ID */}
              <div className="space-y-1.5">
                <Label className="text-foreground/80 text-xs uppercase tracking-wide font-ui">
                  UPI ID
                </Label>
                <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-2">
                  <span className="font-ui text-sm text-foreground flex-1 break-all">
                    {UPI_ID}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyUpi}
                    className="flex-shrink-0 text-xs px-3 border-primary/40 text-primary hover:bg-primary/10"
                    data-ocid="payment.copy_upi.button"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 mr-1 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      "Copy"
                    )}
                  </Button>
                </div>
              </div>

              {/* UPI Apps */}
              <div className="grid grid-cols-2 gap-2">
                {upiApps.map((app) => (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => openUpiApp(app.name, app.scheme)}
                    className="flex items-center justify-center gap-1.5 bg-secondary border border-border rounded-lg py-2 px-3 text-sm font-ui hover:border-primary/40 transition-colors w-full"
                    data-ocid="payment.upi_app.button"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-primary" />
                    {app.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Tap an app → UPI ID auto-copied → paste in payment field
              </p>

              {/* Submit UTR */}
              {!showUtrForm ? (
                <Button
                  onClick={() => setShowUtrForm(true)}
                  className="w-full bg-primary text-primary-foreground font-ui font-semibold"
                  data-ocid="payment.submit_utr.button"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  I've Paid — Submit Transaction ID
                </Button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 border-t border-border pt-4"
                  >
                    <h3 className="font-ui font-semibold text-sm">
                      Payment Details
                    </h3>

                    <div className="space-y-1.5">
                      <Label className="text-foreground/80 text-sm">
                        Transaction ID / UTR{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="12-digit UTR number"
                        value={utrForm.txId}
                        onChange={(e) => {
                          setUtrForm((p) => ({ ...p, txId: e.target.value }));
                          setUtrError("");
                        }}
                        className="bg-secondary border-border"
                        data-ocid="payment.utr.input"
                        maxLength={20}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-foreground/80 text-sm">
                        Your Phone Number{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={utrForm.phone}
                        onChange={(e) =>
                          setUtrForm((p) => ({ ...p, phone: e.target.value }))
                        }
                        className="bg-secondary border-border"
                        data-ocid="payment.phone.input"
                        type="tel"
                        inputMode="numeric"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-foreground/80 text-sm">
                        Amount
                      </Label>
                      <Input
                        value={`₹${utrForm.amount}`}
                        readOnly
                        className="bg-secondary border-border opacity-70"
                        data-ocid="payment.amount.input"
                      />
                    </div>

                    {utrError && (
                      <div
                        className="flex items-start gap-2 text-destructive text-sm"
                        data-ocid="payment.utr.error_state"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{utrError}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowUtrForm(false)}
                        className="flex-1 border-border"
                        data-ocid="payment.cancel.button"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmPayment}
                        disabled={isSubmittingPayment}
                        className="flex-1 bg-primary text-primary-foreground font-ui font-semibold"
                        data-ocid="payment.confirm.button"
                      >
                        {isSubmittingPayment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          {/* Earning preview */}
          <Card className="bg-card/60 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-primary" />
                <span className="text-sm font-ui font-medium">
                  After payment approval
                </span>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-400" /> ₹150 joining
                  bonus credited
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-400" /> Referral code
                  unlocked
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-400" /> Premium video
                  library access
                </li>
              </ul>
            </CardContent>
          </Card>

          {phoneAuth.isLoggedIn && (
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/dashboard" })}
              className="w-full text-muted-foreground"
              data-ocid="payment.dashboard.button"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  // ─── Render: Success Step ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">
          Payment Submitted!
        </h1>
        <p className="text-muted-foreground mb-6">
          Your payment details have been submitted. Admin will verify and
          approve within a few hours.
        </p>
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4 text-sm text-left space-y-2">
            <div className="flex items-center gap-2 text-amber">
              <Shield className="w-4 h-4" />
              <span className="font-ui font-medium">What happens next?</span>
            </div>
            <ul className="space-y-1 text-muted-foreground pl-6">
              <li>Admin verifies your UTR number</li>
              <li>₹150 joining bonus is credited to your wallet</li>
              <li>Your referral code is activated</li>
              <li>Full access to video library is unlocked</li>
            </ul>
          </CardContent>
        </Card>
        <Button
          onClick={() => navigate({ to: "/dashboard" })}
          className="w-full bg-primary text-primary-foreground font-ui font-semibold"
          data-ocid="payment.success.dashboard.button"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
