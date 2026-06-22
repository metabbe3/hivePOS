"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Loader2, Lock, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiClientError } from "@/modules/shared";

export function SettingsManager({ admin }: { admin: { id: string; email: string; name: string; role: string } }) {
  const confirm = useConfirm();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [revoking, setRevoking] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    setSavingPw(true);
    try {
      await apiFetch("/api/super-admin/me/password", {
        method: "POST",
        body: { currentPassword: currentPw, newPassword: newPw },
      });
      toast.success("Password diubah. Session lain sudah di-revoke — silakan login ulang dengan password baru.");
      // ponytail: password change bumps sessionVersion; current session must re-auth.
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => signOut({ callbackUrl: "/super-admin/login" }), 1500);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal mengubah password.");
    } finally {
      setSavingPw(false);
    }
  }

  async function handleRevokeSessions() {
    if (!(await confirm({
      title: "Revoke semua session?",
      description: "Revoke semua session lain? Device lain akan dipaksa login ulang.",
      destructive: true,
    }))) return;
    setRevoking(true);
    try {
      await apiFetch("/api/super-admin/me/sessions", { method: "POST" });
      toast.success("Session lain di-revoke. Device ini tetap aktif.");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Gagal revoke sessions.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="rounded-xl bg-card ring-1 ring-foreground/10 shadow-sm p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Lock className="h-4 w-4" />
          Account
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-mono">{admin.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{admin.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-semibold">{admin.role}</dd>
          </div>
        </dl>
      </section>

      <form onSubmit={handleChangePassword} className="rounded-xl bg-card ring-1 ring-foreground/10 shadow-sm p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Lock className="h-4 w-4" />
          Change Password
        </h2>
        <div className="space-y-3">
          <FormField label="Current password">
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
          </FormField>
          <FormField label="New password (min 8)">
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
          </FormField>
          <FormField label="Confirm new password">
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
          </FormField>
        </div>
        <Button type="submit" disabled={savingPw} className="bg-gradient-to-r from-brand-600 to-brand-700">
          {savingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ubah Password
        </Button>
        <p className="text-xs text-muted-foreground">
          Mengubah password otomatis revoke semua session di device lain.
        </p>
      </form>

      <section className="rounded-xl bg-destructive/5 ring-1 ring-destructive/20 p-6 space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-destructive">
          <ShieldAlert className="h-4 w-4" />
          Active Sessions
        </h2>
        <p className="text-sm text-muted-foreground">
          Revoke semua session lain tanpa mengubah password. Device ini tetap aktif.
        </p>
        <Button variant="destructive" onClick={handleRevokeSessions} disabled={revoking}>
          {revoking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          Revoke Other Sessions
        </Button>
      </section>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
