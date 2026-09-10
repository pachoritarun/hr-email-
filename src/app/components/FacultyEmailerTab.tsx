"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload, Mail, User, Building2, GraduationCap, Briefcase, Heart,
  Save, Send, Copy, Eye, Smartphone, Monitor, CheckCircle,
  XCircle, Trash2, RefreshCw, Sparkles, AlertCircle, FileCode, Check,
  Lock, Key, EyeOff, ShieldCheck, Settings, ChevronDown, ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";
import { generateFacultyWelcomeEmailHtml } from "@/lib/email-templates";
import { BASE_PATH, getAssetUrl } from "@/lib/config";

interface FacultyEmailerTabProps {
  isDark: boolean;
  smtpConfig: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  setSmtpConfig?: React.Dispatch<React.SetStateAction<{
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }>>;
}

interface FacultyRecord {
  id?: number;
  name: string;
  salutation?: string;
  designation: string;
  department: string;
  qualification: string;
  previous_experience: string;
  hobbies: string;
  email: string;
  photo_mime?: string;
  created_at?: string;
  sent_count?: number;
  last_sent_at?: string;
}

const DEFAULT_FACULTY = {
  name: "Ms. Bidisha Chakraborty",
  designation: "Assistant Professor-II",
  department: "Department of Forensic Science",
  qualification: "M.Sc (2025) in Forensic Science",
  previousExperience: "Assistant Professor in the Department of Forensic Science at Aditya University, Andhra Pradesh",
  hobbies: "sports and travelling",
  email: "bidisha.chakraborty@jecrcu.edu.in",
  customBody: "",
};

export default function FacultyEmailerTab({ isDark, smtpConfig, setSmtpConfig }: FacultyEmailerTabProps) {
  // Form fields
  const [facultyForm, setFacultyForm] = useState({
    id: undefined as number | undefined,
    name: DEFAULT_FACULTY.name,
    designation: DEFAULT_FACULTY.designation,
    department: DEFAULT_FACULTY.department,
    qualification: DEFAULT_FACULTY.qualification,
    previousExperience: DEFAULT_FACULTY.previousExperience,
    hobbies: DEFAULT_FACULTY.hobbies,
    email: DEFAULT_FACULTY.email,
    customBody: "",
  });

  // Photo management
  const [photoPreview, setPhotoPreview] = useState<string>(getAssetUrl("/emailer-assets/sample-professor.png"));
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [photoMime, setPhotoMime] = useState<string>("image/jpeg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct SMTP configuration & Password
  const [smtpHost, setSmtpHost] = useState(smtpConfig?.host || "smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(smtpConfig?.port || 465);
  const [smtpUser, setSmtpUser] = useState(smtpConfig?.user || "admin@jecrcu.edu.in");
  const [smtpPass, setSmtpPass] = useState(smtpConfig?.pass || "");
  const [smtpFrom, setSmtpFrom] = useState(smtpConfig?.from || "JECRC University HR <admin@jecrcu.edu.in>");
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvancedSmtp, setShowAdvancedSmtp] = useState(false);

  // Sync password or user changes
  const handleSmtpChange = (key: string, val: any) => {
    if (key === "pass") setSmtpPass(val);
    if (key === "user") setSmtpUser(val);
    if (key === "host") setSmtpHost(val);
    if (key === "port") setSmtpPort(Number(val) || 465);
    if (key === "from") setSmtpFrom(val);

    if (setSmtpConfig) {
      setSmtpConfig((prev) => ({
        ...prev,
        [key]: val,
      }));
    }
  };

  // Preview options
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "code">("desktop");
  const [copiedCode, setCopiedCode] = useState(false);

  // Dispatch settings
  const [recipientMode, setRecipientMode] = useState<"faculty_only" | "test" | "custom_list">("faculty_only");
  const [testEmail, setTestEmail] = useState("");
  const [customEmailsInput, setCustomEmailsInput] = useState("");

  // Saved faculty list from MySQL
  const [savedFaculty, setSavedFaculty] = useState<FacultyRecord[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch saved faculty on mount
  useEffect(() => {
    fetchSavedFaculty();
  }, []);

  const fetchSavedFaculty = async () => {
    setIsLoadingSaved(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/faculty`);
      const json = await res.json();
      if (json.success) {
        setSavedFaculty(json.faculty || []);
      }
    } catch (err) {
      console.error("Error fetching faculty list:", err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Handle image upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image file is too large (max 8MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPhotoBase64(base64);
      setPhotoPreview(base64);
      setPhotoMime(file.type);
      toast.success("Professor photo uploaded! Live preview updated.");
    };
    reader.readAsDataURL(file);
  };

  // Reset to default sample
  const handleLoadSample = () => {
    setFacultyForm({
      id: undefined,
      name: DEFAULT_FACULTY.name,
      designation: DEFAULT_FACULTY.designation,
      department: DEFAULT_FACULTY.department,
      qualification: DEFAULT_FACULTY.qualification,
      previousExperience: DEFAULT_FACULTY.previousExperience,
      hobbies: DEFAULT_FACULTY.hobbies,
      email: DEFAULT_FACULTY.email,
      customBody: "",
    });
    setPhotoPreview(getAssetUrl("/emailer-assets/sample-professor.png"));
    setPhotoBase64("");
    toast.success("Loaded sample flyer data (Ms. Bidisha Chakraborty)");
  };

  // Clear form
  const handleClearForm = () => {
    setFacultyForm({
      id: undefined,
      name: "",
      designation: "Assistant Professor",
      department: "Department of ",
      qualification: "",
      previousExperience: "",
      hobbies: "",
      email: "",
      customBody: "",
    });
    setPhotoPreview(getAssetUrl("/emailer-assets/sample-professor.png"));
    setPhotoBase64("");
    toast("Form cleared. Ready for new professor.", { icon: "🧹" });
  };

  // Save to MySQL
  const handleSaveToDatabase = async () => {
    if (!facultyForm.name || !facultyForm.email || !facultyForm.designation) {
      return toast.error("Please fill in professor's name, designation, and email.");
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving professor profile & photo to MySQL...");

    try {
      const payload = {
        ...facultyForm,
        photoBase64: photoBase64 || undefined,
        photoMime,
      };

      const res = await fetch(`${BASE_PATH}/api/faculty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || "Professor profile stored in MySQL successfully!", { id: toastId });
        if (json.id) {
          setFacultyForm((prev) => ({ ...prev, id: json.id }));
        }
        fetchSavedFaculty();
      } else {
        toast.error("Failed to save: " + json.error, { id: toastId });
      }
    } catch (err: any) {
      toast.error("Network error while saving to MySQL", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved record into form
  const handleSelectRecord = (record: FacultyRecord) => {
    setFacultyForm({
      id: record.id,
      name: record.name,
      designation: record.designation,
      department: record.department,
      qualification: record.qualification || "",
      previousExperience: record.previous_experience || "",
      hobbies: record.hobbies || "",
      email: record.email,
      customBody: "",
    });

    if (record.id) {
      setPhotoPreview(`${BASE_PATH}/api/faculty/photo?id=${record.id}&t=${Date.now()}`);
      setPhotoBase64("");
    }
    toast.success(`Loaded profile of ${record.name}`);
  };

  // Delete saved record
  const handleDeleteRecord = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the database?`)) return;

    try {
      const res = await fetch(`${BASE_PATH}/api/faculty?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Profile removed from MySQL.");
        if (facultyForm.id === id) {
          setFacultyForm((prev) => ({ ...prev, id: undefined }));
        }
        fetchSavedFaculty();
      } else {
        toast.error("Failed to delete: " + json.error);
      }
    } catch (err) {
      toast.error("Error deleting record");
    }
  };

  // Direct send email with direct SMTP password
  const handleSendEmail = async () => {
    if (!facultyForm.name || !facultyForm.email) {
      return toast.error("Please provide professor's name and email.");
    }

    const activePass = smtpPass || smtpConfig?.pass;
    if (!activePass) {
      return toast.error("Please enter your Google App Password / SMTP Password below to send the email directly.");
    }

    setIsSending(true);
    const toastId = toast.loading("Dispatching Welcome Aboard announcement email...");

    try {
      const customEmails = customEmailsInput
        .split(/[,;\n]/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const activeSmtp = {
        host: smtpHost,
        port: Number(smtpPort) || 465,
        user: smtpUser,
        pass: activePass,
        from: smtpFrom || `JECRC University HR <${smtpUser}>`,
      };

      const payload = {
        facultyId: facultyForm.id,
        facultyData: {
          ...facultyForm,
          photoBase64: photoBase64 || undefined,
          photoUrl: photoPreview,
        },
        smtpConfig: activeSmtp,
        recipientMode,
        testEmail,
        customEmails,
      };

      const res = await fetch(`${BASE_PATH}/api/faculty/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: toastId });
        fetchSavedFaculty();
      } else {
        toast.error("Dispatch failed: " + json.error, { id: toastId });
      }
    } catch (err: any) {
      toast.error("Network error while sending email", { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  // Generate HTML for preview and code copy
  const generatedHtml = generateFacultyWelcomeEmailHtml({
    ...facultyForm,
    photoUrl: photoPreview,
    bannerLogoUrl: getAssetUrl("/emailer-assets/jecrc-banner-clean.png"),
    welcomeAboardUrl: getAssetUrl("/emailer-assets/welcome-aboard-clean.png"),
  });

  // Copy HTML
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopiedCode(true);
    toast.success("HTML Email code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-8 animate-step-in">
      {/* Top Banner Notice */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark ? "dark-glass border-slate-800/80 shadow-2xl" : "light-glass border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-red-600/15 text-red-500 border border-red-500/30">
                Official JECRC HR Portal
              </span>
              <span className="text-xs text-slate-400">Direct SMTP Send &amp; MySQL Stored</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight text-slate-900 dark:text-slate-100">
              New Faculty &amp; Professor "Welcome Aboard" Emailer
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              HR can update professor details, upload high-resolution photos, enter the sender SMTP password directly, preview the flyer in real-time, and dispatch immediately.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLoadSample}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center space-x-2 transition-all cursor-pointer ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Sample (Ms. Bidisha)</span>
            </button>
            <button
              onClick={handleClearForm}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center space-x-2 transition-all cursor-pointer ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ===================================================== */}
        {/* LEFT COLUMN: HR INPUTS, PHOTO & DIRECT SMTP (5 cols) */}
        {/* ===================================================== */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Photo Upload */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark ? "dark-glass border-slate-800 shadow-xl" : "light-glass border-slate-200"
          }`}>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>1. Professor Portrait Photo</span>
              <span className="text-[10px] text-blue-500 lowercase font-normal">stored in MySQL</span>
            </label>

            <div className="flex items-center gap-5">
              {/* Photo Preview in Arch Frame */}
              <div className="relative group shrink-0">
                <div className="w-24 h-28 rounded-t-full rounded-b-md overflow-hidden border-2 border-red-500/50 bg-slate-900 flex items-center justify-center shadow-lg">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Professor Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Upload Action */}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload / Change Photo</span>
                </button>
                <div className="text-[11px] text-slate-500 leading-tight">
                  Supports PNG, JPG, WebP. Fits into the official JECRC arched portrait frame.
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Faculty Profile Fields */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-all ${
            isDark ? "dark-glass border-slate-800 shadow-xl" : "light-glass border-slate-200"
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-red-500" />
              <span>2. Professor Details</span>
            </h3>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Full Name with Prefix
              </label>
              <input
                type="text"
                value={facultyForm.name}
                onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                placeholder="e.g. Ms. Bidisha Chakraborty"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none transition-all ${
                  isDark ? "dark-input" : "light-input"
                }`}
              />
            </div>

            {/* Designation & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Designation
                </label>
                <input
                  type="text"
                  value={facultyForm.designation}
                  onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                  placeholder="e.g. Assistant Professor-II"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none transition-all ${
                    isDark ? "dark-input" : "light-input"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Department
                </label>
                <input
                  type="text"
                  value={facultyForm.department}
                  onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                  placeholder="e.g. Department of Forensic Science"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none transition-all ${
                    isDark ? "dark-input" : "light-input"
                  }`}
                />
              </div>
            </div>

            {/* Academic Qualification */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Academic Qualification
              </label>
              <input
                type="text"
                value={facultyForm.qualification}
                onChange={(e) => setFacultyForm({ ...facultyForm, qualification: e.target.value })}
                placeholder="e.g. M.Sc (2025) in Forensic Science"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none transition-all ${
                  isDark ? "dark-input" : "light-input"
                }`}
              />
            </div>

            {/* Previous Experience */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Previous Experience
              </label>
              <textarea
                rows={2}
                value={facultyForm.previousExperience}
                onChange={(e) => setFacultyForm({ ...facultyForm, previousExperience: e.target.value })}
                placeholder="e.g. Assistant Professor in the Department of Forensic Science at Aditya University, Andhra Pradesh"
                className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none transition-all resize-none ${
                  isDark ? "dark-input" : "light-input"
                }`}
              />
            </div>

            {/* Hobbies & Personal Interests */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Free Time / Interests
              </label>
              <input
                type="text"
                value={facultyForm.hobbies}
                onChange={(e) => setFacultyForm({ ...facultyForm, hobbies: e.target.value })}
                placeholder="e.g. sports and travelling"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none transition-all ${
                  isDark ? "dark-input" : "light-input"
                }`}
              />
            </div>

            {/* Official University Email */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Official Faculty Email
              </label>
              <input
                type="email"
                value={facultyForm.email}
                onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                placeholder="e.g. bidisha.chakraborty@jecrcu.edu.in"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none transition-all ${
                  isDark ? "dark-input" : "light-input"
                }`}
              />
            </div>
          </div>

          {/* Card 3: DIRECT SMTP & DISPATCH CONFIGURATION */}
          <div className={`p-6 rounded-3xl border space-y-4 transition-all ${
            isDark ? "dark-glass border-slate-800 shadow-xl" : "light-glass border-slate-200"
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>3. Direct SMTP Sender &amp; Password</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SSL Port {smtpPort}
              </span>
            </div>

            {/* Sender Email & Direct App Password */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Sender Email Address
                </label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => handleSmtpChange("user", e.target.value)}
                  placeholder="admin@jecrcu.edu.in"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none font-mono ${
                    isDark ? "dark-input" : "light-input"
                  }`}
                />
              </div>

              {/* Direct SMTP / Google App Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>Google App Password / SMTP Password</span>
                  </label>
                  <span className="text-[10px] text-slate-400">16 characters</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={smtpPass}
                    onChange={(e) => handleSmtpChange("pass", e.target.value)}
                    placeholder="Enter 16-character App Password (e.g. abcd efgh ijkl mnop)"
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs border focus:outline-none font-mono tracking-wider ${
                      isDark ? "dark-input" : "light-input"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>Directly sends via Google SMTP SSL without rate limits.</span>
                </div>
              </div>

              {/* Collapsible Advanced SMTP Options */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedSmtp(!showAdvancedSmtp)}
                  className="text-[11px] font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>{showAdvancedSmtp ? "Hide Server Settings" : "Change SMTP Server / Port"}</span>
                  {showAdvancedSmtp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showAdvancedSmtp && (
                  <div className="mt-2.5 p-3 rounded-xl border space-y-2.5 bg-slate-900/50 border-slate-800 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">SMTP Host</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => handleSmtpChange("host", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs dark-input"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Port (SSL/TLS)</label>
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={(e) => handleSmtpChange("port", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border text-xs dark-input"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Sender Name &amp; Email</label>
                      <input
                        type="text"
                        value={smtpFrom}
                        onChange={(e) => handleSmtpChange("from", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs dark-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recipient Mode Options */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Target:
              </label>

              {[
                { id: "faculty_only", label: `Send directly to this Professor (${facultyForm.email || "No email entered"})` },
                { id: "test", label: "Send a Test Email to my address" },
                { id: "custom_list", label: "Custom Recipient List (comma-separated emails)" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start space-x-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    recipientMode === opt.id
                      ? isDark
                        ? "bg-red-500/10 border-red-500/40 text-slate-100"
                        : "bg-red-50 border-red-300 text-slate-900 font-medium"
                      : isDark
                      ? "border-slate-800/80 hover:bg-slate-900/60 text-slate-400"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={recipientMode === opt.id}
                    onChange={() => setRecipientMode(opt.id as any)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs">{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Conditional input for test email */}
            {recipientMode === "test" && (
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Recipient Test Email
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your.email@jecrcu.edu.in"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                    isDark ? "dark-input" : "light-input"
                  }`}
                />
              </div>
            )}

            {/* Conditional input for custom emails */}
            {recipientMode === "custom_list" && (
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Enter comma-separated emails
                </label>
                <textarea
                  rows={2}
                  value={customEmailsInput}
                  onChange={(e) => setCustomEmailsInput(e.target.value)}
                  placeholder="dean@jecrcu.edu.in, hod.forensic@jecrcu.edu.in"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none resize-none ${
                    isDark ? "dark-input" : "light-input"
                  }`}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95 ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                }`}
              >
                <Save className="w-4 h-4 text-emerald-500" />
                <span>{isSaving ? "Saving..." : "Save to MySQL"}</span>
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending}
                className="px-4 py-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-600/25 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? "Sending..." : "Dispatch Email"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* RIGHT COLUMN: LIVE EMAIL PREVIEW & CODE (7 cols)     */}
        {/* ===================================================== */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Top Preview Controls Toolbar */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
            isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-red-500" />
                <span>Live Flyer Preview</span>
              </span>

              {/* View Switchers */}
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  previewMode === "desktop"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>

              <button
                onClick={() => setPreviewMode("mobile")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  previewMode === "mobile"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>

              <button
                onClick={() => setPreviewMode("code")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  previewMode === "code"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>HTML Code</span>
              </button>
            </div>

            {/* Copy HTML Button */}
            <button
              onClick={handleCopyHtml}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                copiedCode
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : isDark
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? "Copied!" : "Copy HTML"}</span>
            </button>
          </div>

          {/* Preview Canvas Container */}
          <div className={`p-4 rounded-3xl border flex items-center justify-center min-h-[640px] overflow-x-auto transition-all ${
            isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-300"
          }`}>
            {previewMode === "code" ? (
              <div className="w-full">
                <textarea
                  readOnly
                  rows={28}
                  value={generatedHtml}
                  className="w-full p-4 rounded-2xl font-mono text-xs bg-slate-900 text-emerald-400 border border-slate-800 focus:outline-none"
                />
              </div>
            ) : (
              <div
                className={`transition-all duration-300 ${
                  previewMode === "mobile"
                    ? "w-[380px] shadow-2xl rounded-3xl overflow-hidden border-8 border-slate-800"
                    : "w-[620px] max-w-full shadow-2xl rounded-2xl overflow-hidden"
                }`}
              >
                <iframe
                  title="Live Emailer Preview"
                  srcDoc={generatedHtml}
                  className="w-full border-0"
                  style={{ height: previewMode === "mobile" ? "760px" : "860px" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* BOTTOM SECTION: SAVED FACULTY DIRECTORY (MySQL)       */}
      {/* ===================================================== */}
      <div className={`p-6 rounded-3xl border space-y-4 transition-all ${
        isDark ? "dark-glass border-slate-800 shadow-xl" : "light-glass border-slate-200"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                MySQL Stored Faculty Directory
              </h3>
              <p className="text-xs text-slate-500">
                Onboarded professors saved in database. Photos are served on-demand via API and inline CID.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSavedFaculty}
            disabled={isLoadingSaved}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingSaved ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Directory Table */}
        {savedFaculty.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-2xl border-slate-700/50">
            <User className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-400">No professors saved in MySQL yet</div>
            <div className="text-xs text-slate-500 mt-1">
              Fill in the form above and click "Save to MySQL" to create a permanent record.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                <tr>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">Professor Name</th>
                  <th className="py-3 px-4">Designation &amp; Dept</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Dispatched</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {savedFaculty.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isDark ? "hover:bg-slate-900/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="w-10 h-12 rounded-t-full rounded-b-sm overflow-hidden bg-slate-800 border border-red-500/40">
                        <img
                          src={`${BASE_PATH}/api/faculty/photo?id=${item.id}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src = getAssetUrl("/emailer-assets/sample-professor.png");
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-200">
                      {item.name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-300">{item.designation}</div>
                      <div className="text-slate-500 text-[11px]">{item.department}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {item.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        (item.sent_count || 0) > 0
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {item.sent_count || 0} times
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleSelectRecord(item)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600/15 text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                      >
                        Load / Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(item.id!, item.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete from MySQL"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
