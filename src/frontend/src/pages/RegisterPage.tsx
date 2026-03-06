import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  Copy,
  Crown,
  Gift,
  Hash,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  Receipt,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerUserProfile,
  useMyProfile,
  useRegisterMutation,
  useSubmitPaymentProofMutation,
} from "../hooks/useQueries";

const UPI_ID = "yespay.bizsbiz12758@yesbankltd";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn, identity, isInitializing } =
    useInternetIdentity();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    referredBy: "",
  });
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [error, setError] = useState<string | null>(null);

  // UTR submission form state
  const [showUtrForm, setShowUtrForm] = useState(false);
  const [utrForm, setUtrForm] = useState({
    txId: "",
    userName: form.name,
    phone: form.phone,
    amount: "118",
  });
  const [utrError, setUtrError] = useState<string | null>(null);

  const registerMutation = useRegisterMutation();
  const submitPaymentProofMutation = useSubmitPaymentProofMutation();

  // Check if user is already registered (returning next-day user scenario)
  const { data: userProfile, isLoading: profileLoading } =
    useCallerUserProfile();
  const { data: myProfile, isLoading: myProfileLoading } = useMyProfile(
    userProfile?.userId ?? null,
  );

  // Auto-jump to payment step if already registered but not yet paid
  useEffect(() => {
    if (step !== "form") return;
    if (!identity || isInitializing) return;
    if (profileLoading || myProfileLoading) return;

    if (myProfile) {
      if (myProfile.isPaid) {
        // Already fully paid → go to dashboard
        navigate({ to: "/dashboard" });
        return;
      }
      // Registered but not paid → jump to payment step with pre-filled data
      setStep("payment");
      setUtrForm((prev) => ({
        ...prev,
        userName: myProfile.name || userProfile?.name || "",
        phone: myProfile.phone || userProfile?.phone || "",
      }));
    }
  }, [
    step,
    identity,
    isInitializing,
    profileLoading,
    myProfileLoading,
    myProfile,
    userProfile,
    navigate,
  ]);

  // Show loading spinner while checking profile for returning users
  const isCheckingProfile =
    !!identity &&
    !isInitializing &&
    step === "form" &&
    (profileLoading || (userProfile != null && myProfileLoading));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleRegister = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!identity) {
      setError("Please login first to register.");
      return;
    }
    try {
      setError(null);
      await registerMutation.mutateAsync({
        name: form.name,
        email: form.email,
        phone: form.phone,
        referredBy: form.referredBy,
      });
      setStep("payment");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
    }
  };

  const handleShowUtrForm = () => {
    // When "I have Paid" is clicked, show UTR form pre-filled with form data
    setUtrForm({
      txId: "",
      userName: form.name,
      phone: form.phone,
      amount: String(total),
    });
    setUtrError(null);
    setShowUtrForm(true);
  };

  const handleUtrFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUtrForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setUtrError(null);
  };

  const handleConfirmPayment = async () => {
    if (!utrForm.txId.trim()) {
      setUtrError("Please enter your Transaction ID or UTR Number.");
      return;
    }
    if (!utrForm.phone.trim()) {
      setUtrError("Please enter your phone number.");
      return;
    }
    if (!utrForm.amount.trim()) {
      setUtrError("Please enter the amount you paid.");
      return;
    }
    if (!utrForm.userName.trim()) {
      setUtrError("Please enter your name.");
      return;
    }

    try {
      setUtrError(null);
      await submitPaymentProofMutation.mutateAsync({
        utr: utrForm.txId.trim(),
        name: utrForm.userName.trim(),
        phone: utrForm.phone.trim(),
        amount: utrForm.amount.trim(),
      });

      setStep("success");
      toast.success("Payment proof submitted! Admin will verify shortly.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      setUtrError(msg);
    }
  };

  const membershipFee = 100;
  const gst = 18;
  const gstAmount = Math.round((membershipFee * gst) / 100);
  const total = membershipFee + gstAmount;

  // Show full-screen loading while checking returning user's payment status
  if (isCheckingProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center glow-gold animate-pulse-gold">
          <Crown className="w-6 h-6 text-primary-foreground" />
        </div>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-ui text-sm">
          Loading your account…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-5 border-b border-border">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="register.back.link"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-gradient-gold">
            Tm11primeTime
          </span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {["Register", "Payment", "Success"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-ui font-bold transition-all ${
                    (step === "form" && i === 0) ||
                    (step === "payment" && i === 1) ||
                    (step === "success" && i === 2)
                      ? "bg-primary text-primary-foreground"
                      : i <
                          (step === "payment" ? 1 : step === "success" ? 2 : 0)
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < (step === "payment" ? 1 : step === "success" ? 3 : 0) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-sm font-ui hidden sm:block ${
                    (step === "form" && i === 0) ||
                    (step === "payment" && i === 1) ||
                    (step === "success" && i === 2)
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {s}
                </span>
                {i < 2 && (
                  <div className="w-8 h-px bg-border hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          {/* Step: Form */}
          {step === "form" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="card-premium">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <CardTitle className="font-display font-bold text-2xl text-foreground">
                      Login / Register
                    </CardTitle>
                  </div>
                  <p className="text-muted-foreground text-sm font-body">
                    Enter your mobile number to get started
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Login prompt */}
                  {!identity && (
                    <Alert className="border-primary/30 bg-primary/10">
                      <Crown className="w-4 h-4 text-primary" />
                      <AlertDescription className="text-sm font-body">
                        You need to login first before registering.{" "}
                        <button
                          type="button"
                          onClick={login}
                          className="text-primary underline font-medium"
                          data-ocid="register.login.button"
                        >
                          {isLoggingIn ? "Logging in..." : "Login now"}
                        </button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert
                      variant="destructive"
                      data-ocid="register.form.error_state"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription className="font-body text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Phone Number — PRIMARY field, visually prominent */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="phone"
                      className="font-ui text-sm font-semibold text-foreground"
                    >
                      Mobile Number *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="pl-10 h-12 text-base bg-input border-border font-body border-primary/40 focus:border-primary ring-primary/20"
                        autoComplete="tel"
                        data-ocid="register.phone.input"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-body">
                      Your mobile number is your primary account identifier
                    </p>
                  </div>

                  {/* Divider between primary and secondary fields */}
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-ui uppercase tracking-widest">
                      Profile Details
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="name"
                      className="font-ui text-sm text-foreground/80"
                    >
                      Full Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className="pl-9 bg-input border-border font-body"
                        data-ocid="register.name.input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="font-ui text-sm text-foreground/80"
                    >
                      Email Address *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="pl-9 bg-input border-border font-body"
                        data-ocid="register.email.input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="referredBy"
                      className="font-ui text-sm text-foreground/80"
                    >
                      Referral Code (Optional)
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="referredBy"
                        name="referredBy"
                        value={form.referredBy}
                        onChange={handleChange}
                        placeholder="Enter referral code"
                        className="pl-9 bg-input border-border font-body"
                        data-ocid="register.referral.input"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full bg-primary text-primary-foreground hover:opacity-90 font-display font-bold text-base py-5"
                    onClick={handleRegister}
                    disabled={
                      registerMutation.isPending || !identity || isLoggingIn
                    }
                    data-ocid="register.submit.button"
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    ) : null}
                    {registerMutation.isPending
                      ? "Registering..."
                      : "Continue to Payment"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step: Payment */}
          {step === "payment" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="card-premium">
                <CardHeader className="pb-4">
                  <CardTitle className="font-display font-bold text-2xl text-foreground">
                    Complete Payment
                  </CardTitle>
                  <p className="text-muted-foreground text-sm font-body">
                    One-time membership fee to activate your account
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Payment Breakdown */}
                  <div className="bg-secondary/50 rounded-xl p-5 space-y-3 border border-border">
                    <div className="flex justify-between text-sm font-ui text-foreground/80">
                      <span>Membership Fee</span>
                      <span>₹{membershipFee}</span>
                    </div>
                    <div className="flex justify-between text-sm font-ui text-muted-foreground">
                      <span>GST ({gst}%)</span>
                      <span>₹{gstAmount}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between font-display font-bold text-lg">
                      <span className="text-foreground">Total</span>
                      <span className="text-gradient-gold">₹{total}</span>
                    </div>
                  </div>

                  {/* Bonus Info */}
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-start gap-3">
                    <Gift className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 animate-float" />
                    <div>
                      <p className="text-primary font-ui font-semibold text-sm">
                        Joining Bonus: ₹150
                      </p>
                      <p className="text-muted-foreground text-xs font-body mt-1">
                        Will be instantly credited to your wallet upon payment
                        completion
                      </p>
                    </div>
                  </div>

                  {/* UPI ID Display Box */}
                  <div className="space-y-2">
                    <p className="text-sm font-ui font-semibold text-foreground/80">
                      Pay via UPI
                    </p>
                    <div className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2.5">
                      <span className="flex-1 font-mono text-sm text-foreground truncate select-all">
                        {UPI_ID}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard
                            .writeText(UPI_ID)
                            .then(() => {
                              toast.success("UPI ID copied!");
                            })
                            .catch(() => {
                              toast.error(
                                "Failed to copy. Please copy manually.",
                              );
                            });
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-ui font-medium text-xs transition-colors flex-shrink-0"
                        aria-label="Copy UPI ID"
                        data-ocid="register.upi_id.button"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <p className="text-sm font-body text-muted-foreground leading-relaxed text-center px-2">
                    Open your UPI app, paste the UPI ID and complete the
                    payment, then tap{" "}
                    <span className="font-semibold text-foreground">
                      'I have Paid'
                    </span>{" "}
                    below.
                  </p>

                  {/* UPI App Deep-link Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* PhonePe */}
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `phonepe://pay?pa=${UPI_ID}`;
                      }}
                      className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 border-purple-500 text-purple-600 hover:bg-purple-500/10 transition-colors font-ui font-semibold text-xs"
                      data-ocid="register.phonepay.button"
                    >
                      <span className="text-lg leading-none">📱</span>
                      <span>PhonePe</span>
                    </button>

                    {/* Google Pay */}
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `tez://upi/pay?pa=${UPI_ID}`;
                      }}
                      className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 border-blue-500 text-blue-600 hover:bg-blue-500/10 transition-colors font-ui font-semibold text-xs"
                      data-ocid="register.gpay.button"
                    >
                      <span className="text-lg leading-none">💳</span>
                      <span>Google Pay</span>
                    </button>

                    {/* BHIM UPI */}
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `upi://pay?pa=${UPI_ID}`;
                      }}
                      className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 border-amber-500 text-amber-600 hover:bg-amber-500/10 transition-colors font-ui font-semibold text-xs"
                      data-ocid="register.bhim.button"
                    >
                      <span className="text-lg leading-none">🏦</span>
                      <span>BHIM UPI</span>
                    </button>
                  </div>

                  {error && (
                    <Alert
                      variant="destructive"
                      data-ocid="register.payment.error_state"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription className="font-body text-sm">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <AnimatePresence mode="wait">
                    {!showUtrForm ? (
                      <motion.div
                        key="paid-button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          className="w-full bg-primary text-primary-foreground hover:opacity-90 font-display font-bold text-base py-5 glow-gold"
                          onClick={handleShowUtrForm}
                          data-ocid="register.payment.submit_button"
                        >
                          ✅ I have Paid
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="utr-form"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        {/* UTR Form Header */}
                        <div className="flex items-center gap-2 pb-1 border-b border-border">
                          <Receipt className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="font-ui font-semibold text-sm text-foreground">
                            Submit Payment Details
                          </span>
                        </div>

                        {utrError && (
                          <Alert
                            variant="destructive"
                            data-ocid="register.payment.error_state"
                          >
                            <AlertCircle className="w-4 h-4" />
                            <AlertDescription className="font-body text-sm">
                              {utrError}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Transaction ID / UTR */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="txId"
                            className="font-ui text-sm text-foreground/80"
                          >
                            Transaction ID / UTR Number *
                          </Label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="txId"
                              name="txId"
                              value={utrForm.txId}
                              onChange={handleUtrFormChange}
                              placeholder="Enter Transaction ID or UTR"
                              className="pl-9 bg-input border-border font-body"
                              autoComplete="off"
                              data-ocid="register.utr.input"
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="utrPhone"
                            className="font-ui text-sm text-foreground/80"
                          >
                            Phone Number *
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="utrPhone"
                              name="phone"
                              type="tel"
                              value={utrForm.phone}
                              onChange={handleUtrFormChange}
                              placeholder="+91 98765 43210"
                              className="pl-9 bg-input border-border font-body"
                              data-ocid="register.utr_phone.input"
                            />
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="utrAmount"
                            className="font-ui text-sm text-foreground/80"
                          >
                            Amount Paid (₹) *
                          </Label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="utrAmount"
                              name="amount"
                              type="number"
                              min="1"
                              value={utrForm.amount}
                              onChange={handleUtrFormChange}
                              placeholder="Enter amount paid"
                              className="pl-9 bg-input border-border font-body"
                              data-ocid="register.utr_amount.input"
                            />
                          </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="utrUserName"
                            className="font-ui text-sm text-foreground/80"
                          >
                            Your Name *
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="utrUserName"
                              name="userName"
                              value={utrForm.userName}
                              onChange={handleUtrFormChange}
                              placeholder="Enter your full name"
                              className="pl-9 bg-input border-border font-body"
                              data-ocid="register.utr_name.input"
                            />
                          </div>
                        </div>

                        {/* Submit */}
                        <Button
                          className="w-full bg-primary text-primary-foreground hover:opacity-90 font-display font-bold text-base py-5 glow-gold"
                          onClick={handleConfirmPayment}
                          disabled={submitPaymentProofMutation.isPending}
                          data-ocid="register.utr.submit_button"
                        >
                          {submitPaymentProofMutation.isPending ? (
                            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          ) : null}
                          {submitPaymentProofMutation.isPending
                            ? "Submitting..."
                            : "Confirm & Submit Proof"}
                        </Button>

                        {/* Back link */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowUtrForm(false);
                            setUtrError(null);
                          }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto font-ui"
                          data-ocid="register.utr_form.cancel.button"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          Back to payment options
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-center text-xs text-muted-foreground font-body">
                    Secured by Internet Computer blockchain
                  </p>
                </CardContent>
              </Card>

              {/* Go to Dashboard — secondary option below the payment card */}
              <div className="mt-5 flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground font-body">
                  Already submitted payment?
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/dashboard" })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-secondary/40 hover:bg-secondary/70 text-foreground/70 hover:text-foreground text-sm font-ui font-medium transition-all"
                  data-ocid="register.payment.goto_dashboard.button"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="card-premium text-center">
                <CardContent className="p-8 space-y-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto glow-gold">
                    <CheckCircle className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-2xl text-gradient-gold mb-2">
                      Payment Proof Submitted!
                    </h2>
                    <p className="text-muted-foreground font-body">
                      Your membership will activate once admin verifies your
                      payment. ₹150 joining bonus will be credited to your
                      wallet upon approval.
                    </p>
                  </div>
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <div className="text-base font-ui font-semibold text-primary">
                      Pending Verification
                    </div>
                    <div className="text-muted-foreground text-sm font-body mt-1">
                      Admin will review your payment proof shortly
                    </div>
                  </div>
                  <Button
                    className="w-full bg-primary text-primary-foreground font-display font-bold"
                    onClick={() => navigate({ to: "/dashboard" })}
                    data-ocid="register.success.dashboard.button"
                  >
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
