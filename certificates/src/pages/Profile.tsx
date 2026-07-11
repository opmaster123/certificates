import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Shield,
  Briefcase,
  Building,
  Phone,
  Mail,
  Camera,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { authService } from "@/services/auth";

const Profile = () => {
  const { user, updateUser } = useAuth();

  // User Schema Fields (Required & Optional)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [updating, setUpdating] = useState(false);

  // Password Change Fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [activeTab, setActiveTab] = useState("personal");

  const navTabs = [
    { id: "personal", label: "البيانات الشخصية", icon: UserIcon },
    { id: "security", label: "الأمان", icon: Shield },
  ];

  const userInitials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setAvatar(user.avatar || "");
      setPhoneNumber(user.phoneNumber || "");
      if (user.birthDate) {
        const d = new Date(user.birthDate);
        if (!isNaN(d.getTime())) {
          setBirthDate(d.toISOString().split("T")[0]);
        } else {
          setBirthDate("");
        }
      } else {
        setBirthDate("");
      }
      setJobTitle(user.jobTitle || "");
      setCompany(user.company || "");
      setExperienceYears(
        typeof user.experienceYears === "number" ? user.experienceYears : "",
      );
    }
  }, [user]);

  const ENGLISH_NAME_REGEX = /^[A-Za-z\s'-]+$/;

  const handleSaveChanges = async () => {
    if (!firstName.trim()) {
      toast.error("الاسم الأول مطلوب");
      return;
    }
    if (!ENGLISH_NAME_REGEX.test(firstName.trim())) {
      toast.error("الاسم الأول يجب أن يكون بالأحرف الإنجليزية فقط");
      return;
    }
    if (!lastName.trim()) {
      toast.error("اسم العائلة مطلوب");
      return;
    }
    if (!ENGLISH_NAME_REGEX.test(lastName.trim())) {
      toast.error("اسم العائلة يجب أن يكون بالأحرف الإنجليزية فقط");
      return;
    }

    setUpdating(true);
    try {
      const updatedUser = await authService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatar: avatar.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        birthDate: birthDate ? new Date(birthDate) : null,
        jobTitle: jobTitle.trim() || undefined,
        company: company.trim() || undefined,
        experienceYears:
          experienceYears !== "" ? Number(experienceYears) : null,
      });

      updateUser(updatedUser);
      toast.success("تم تحديث معلومات الملف الشخصي بنجاح");
    } catch (err: any) {
      toast.error(err.message || "فشل تحديث البيانات، يرجى المحاولة مرة أخرى");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("يرجى إدخال كلمة المرور الحالية");
      return;
    }
    if (!newPassword) {
      toast.error("يرجى إدخال كلمة المرور الجديدة");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("تم تحديث كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "فشل تحديث كلمة المرور");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة صالح");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 2 ميجابايت");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
        toast.success("تم اختيار الصورة بنجاح");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-right" dir="rtl">
        {/* Header */}
        <div className="border-b border-border pb-5">
          <h1 className="text-2xl font-heading font-bold text-foreground">
            الملف الشخصي والإعدادات
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة معلوماتك الشخصية والأمان
          </p>
        </div>

        {/* Tab Selection */}
        <div className="bg-muted/50 p-1 flex flex-wrap gap-1 rounded-xl w-fit">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  isActive
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Personal Info Tab */}
        {activeTab === "personal" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header Avatar Card */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={`${firstName} ${lastName}`}
                    className="h-24 w-24 rounded-2xl object-cover border-2 border-primary/20 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : null}
                {(!avatar || avatar === "") && (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl gradient-primary text-primary-foreground text-3xl font-heading font-bold shadow-md">
                    {userInitials}
                  </div>
                )}
              </div>

              <div className="text-center md:text-right flex-1 space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <h3 className="font-heading font-bold text-card-foreground text-xl">
                    {firstName || lastName
                      ? `${firstName} ${lastName}`
                      : "مستخدم جديد"}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground dir-ltr text-center md:text-right">
                  {email}
                </p>
                <div className="pt-2 flex items-center justify-center md:justify-start gap-2">
                  <label htmlFor="avatar-file-upload">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-xs cursor-pointer"
                      asChild
                    >
                      <span>
                        <Camera className="h-3.5 w-3.5" /> تحميل صورة جديدة
                      </span>
                    </Button>
                  </label>
                  <input
                    id="avatar-file-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  {avatar && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-destructive hover:text-destructive"
                      onClick={() => setAvatar("")}
                    >
                      حذف الصورة
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-8">
              {/* Required Fields Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h4 className="font-heading font-bold text-foreground text-base">
                    البيانات الأساسية (إلزامية)
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-destructive border-destructive/30 text-xs"
                  >
                    * مطلوبة
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between text-sm font-semibold">
                      <span>الاسم الأول</span>
                      <span className="text-xs text-destructive">* مطلوب</span>
                    </Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="مثال: Ahmed"
                      className="bg-background text-right"
                      dir="rtl"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between text-sm font-semibold">
                      <span>اسم العائلة</span>
                      <span className="text-xs text-destructive">* مطلوب</span>
                    </Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="مثال: Ali"
                      className="bg-background text-right"
                      dir="rtl"
                    />
                  </div>

                  {/* Email (Disabled / Read-only) */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center justify-between text-sm font-semibold">
                      <span>البريد الإلكتروني</span>
                      <span className="text-xs text-muted-foreground">
                        غير قابل للتعديل
                      </span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={email}
                        disabled
                        readOnly
                        placeholder="user@example.com"
                        className="bg-muted text-left pl-10 cursor-not-allowed opacity-80"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Fields Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <h4 className="font-heading font-bold text-foreground text-base">
                    التفاصيل المهنية
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-muted-foreground text-xs"
                  >
                    اختياري
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between text-sm font-semibold">
                      <span>رقم الهاتف</span>
                      <span className="text-xs text-muted-foreground">
                        اختياري
                      </span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+966500000000"
                        className="bg-background text-left pl-10"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between text-sm font-semibold">
                      <span>تاريخ الميلاد</span>
                      <span className="text-xs text-muted-foreground">
                        اختياري
                      </span>
                    </Label>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-background text-right"
                      dir="rtl"
                    />
                  </div>

                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between text-sm font-semibold">
                      <span>المسمى الوظيفي</span>
                      <span className="text-xs text-muted-foreground">
                        اختياري
                      </span>
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="مدير تدقيق داخلي"
                        className="bg-background text-right pl-10"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between text-sm font-semibold">
                      <span>الشركة / المنظمة</span>
                      <span className="text-xs text-muted-foreground">
                        اختياري
                      </span>
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="اسم الشركة"
                        className="bg-background text-right pl-10"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Experience Years */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center justify-between text-sm font-semibold">
                      <span>سنوات الخبرة العملية</span>
                      <span className="text-xs text-muted-foreground">
                        اختياري
                      </span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="60"
                      value={experienceYears}
                      onChange={(e) =>
                        setExperienceYears(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      placeholder="مثال: 5"
                      className="bg-background text-right"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-start">
                <Button
                  onClick={handleSaveChanges}
                  disabled={updating}
                  className="gradient-primary border-0 text-primary-foreground hover:opacity-90 min-w-[140px]"
                >
                  {updating ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-heading font-bold text-card-foreground mb-4">
                تغيير كلمة المرور
              </h3>
              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label>كلمة المرور الحالية</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور الجديدة</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-left"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تأكيد كلمة المرور الجديدة</Label>
                  <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-left"
                    dir="ltr"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="gradient-primary border-0 text-primary-foreground hover:opacity-90 w-fit"
                >
                  {changingPassword ? "جاري التحديث..." : "تحديث كلمة المرور"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;
