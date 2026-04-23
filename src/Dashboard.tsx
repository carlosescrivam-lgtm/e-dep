import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import logoEdep from "./assets/logo-edep.png";
import imageCompression from "browser-image-compression";
type DbPage = {
  id: string;
  full_name: string | null;
  custom_text: string | null;
  theme: string | null;
  status: string | null;
  closes_at: string | null;
  slug: string | null;
  access_token: string | null;
  created_at: string | null;
  funeral_home_id?: string | null;
  is_searchable?: boolean | null;
  funeral_homes?: { name?: string | null } | { name?: string | null }[] | null;
};

type Condolence = {
  id: string;
  page_id: string;
  created_at: string | null;
  deleted_at?: string | null;
  moderation_status?: string | null;
};

type PageCard = {
  id: string;
  full_name: string;
  custom_text: string;
  theme: string;
  status: string;
  closes_at: string | null;
  slug: string;
  access_token: string;
  created_at: string | null;
  funeral_home_name: string;
  condolences_count: number;
  is_searchable: boolean;
  pending_count: number;
  rejected_count: number;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<PageCard[]>([]);
  const [adminFuneralHomes, setAdminFuneralHomes] = useState<any[]>([]);
  const [adminSystemParticularsHome, setAdminSystemParticularsHome] = useState<any | null>(null);
  const [adminStats, setAdminStats] = useState({
  totalFuneralHomes: 0,
  totalPages: 0,
  openPages: 0,
  closedPages: 0,
});
  const [adminViewingFuneralHomeId, setAdminViewingFuneralHomeId] = useState<string | null>(null);
  const [adminViewingFuneralHomeName, setAdminViewingFuneralHomeName] = useState("");
  const [error, setError] = useState("");
  const [isSearchable, setIsSearchable] = useState(false);
  const [currentRole, setCurrentRole] = useState<"admin" | "funeral_home" | "">("");
  const [currentFuneralHomeId, setCurrentFuneralHomeId] = useState<string | null>(null);
  const [currentFuneralHomeName, setCurrentFuneralHomeName] = useState("");
  const [currentSubscriptionStatus, setCurrentSubscriptionStatus] = useState("");
  const [currentAccessBlocked, setCurrentAccessBlocked] = useState(false);
  const [search, setSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminCountryFilter, setAdminCountryFilter] = useState("");
  const [adminSelectedMonth, setAdminSelectedMonth] = useState(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
});
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
  const [fullName, setFullName] = useState("");
  const [customText, setCustomText] = useState("");
  const [theme, setTheme] = useState("classic");
  const [familyEmail, setFamilyEmail] = useState("");
  const [closeDays, setCloseDays] = useState("10");
  const [funeralHomeNameEdit, setFuneralHomeNameEdit] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [savingFuneralHome, setSavingFuneralHome] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
const [logoFileError, setLogoFileError] = useState("");
const [photoPreview, setPhotoPreview] = useState("");
const createPhotoInputRef = useRef<HTMLInputElement | null>(null);
const logoInputRef = useRef<HTMLInputElement | null>(null);
const [photoFile, setPhotoFile] = useState<File | null>(null);
const [showCreateForm, setShowCreateForm] = useState(false);
const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
const [moderationPageId, setModerationPageId] = useState<string | null>(null);
const [pageMessages, setPageMessages] = useState<Record<string, any[]>>({});
const [loadingMessagesForPage, setLoadingMessagesForPage] = useState<string | null>(null);
const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
const [pendingMessagesByPage, setPendingMessagesByPage] = useState<Record<string, any[]>>({});
const [rejectedMessagesByPage, setRejectedMessagesByPage] = useState<Record<string, any[]>>({});
const [loadingPendingForPage, setLoadingPendingForPage] = useState<string | null>(null);
const siteBase =
    typeof window !== "undefined" ? window.location.origin : "";
const [isMobile, setIsMobile] = useState(
  typeof window !== "undefined" ? window.innerWidth < 900 : false
);

const [currentSubscriptionPlan, setCurrentSubscriptionPlan] = useState("");
const [currentTrialUntil, setCurrentTrialUntil] = useState<string | null>(null);
const [currentSubscriptionStart, setCurrentSubscriptionStart] = useState<string | null>(null);
const [currentSubscriptionUntil, setCurrentSubscriptionUntil] = useState<string | null>(null);
const [showFuneralHomePanel, setShowFuneralHomePanel] = useState(false);
const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(false);
const [showStripePanel, setShowStripePanel] = useState(false);
const [showSecurityPanel, setShowSecurityPanel] = useState(false);
const [accountEmail, setAccountEmail] = useState("");
const [newPassword, setNewPassword] = useState("");
const [allowExpiredAccess, setAllowExpiredAccess] = useState(false);

  useEffect(() => {
  async function init() {
    try {
      setLoading(true);

      await loadCurrentUserProfile();
      await loadFuneralHomeData();
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No se pudo iniciar el dashboard.");
    } finally {
      setLoading(false);
    }
  }

  init();
}, []);

useEffect(() => {
  async function syncAdminList() {
    if (currentRole !== "admin") return;

    try {
      await loadAdminData();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No se pudieron cargar las funerarias.");
    }
  }

  syncAdminList();
}, [currentRole]);

useEffect(() => {
  async function syncAdminSupportView() {
    if (currentRole !== "admin" || !adminViewingFuneralHomeId) return;

    try {
      setLoading(true);
      setError("");

      await loadAdminSupportData(adminViewingFuneralHomeId);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No se pudo abrir el panel de la funeraria.");
    } finally {
      setLoading(false);
    }
  }

  syncAdminSupportView();
}, [currentRole, adminViewingFuneralHomeId]);




  const getTrialDaysText = (dateString: string | null) => {
    if (!dateString) return "Está usando una versión trial gratuita.";

    const today = new Date();
    const endDate = new Date(dateString);

    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endOnly = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    const diffMs = endOnly.getTime() - todayOnly.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return "Su periodo trial gratuito finaliza hoy.";
    }

    if (diffDays === 1) {
      return "Está Vd en modo trial gratuito. Le queda 1 día.";
    }

    return `Está Vd en modo trial gratuito. Le quedan ${diffDays} días.`;
  };



useEffect(() => {
  async function loadAccountEmail() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user?.email) {
      setAccountEmail(user.email);
    }
  }

  loadAccountEmail();
}, []);


useEffect(() => {
  function handleResize() {
    setIsMobile(window.innerWidth < 900);
  }

  handleResize();
  window.addEventListener("resize", handleResize);

  return () => window.removeEventListener("resize", handleResize);
}, []);



  async function loadCurrentUserProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("No hay sesión iniciada.");

  const { data, error } = await supabase
  .from("funeral_home_users")
  .select(`
    funeral_home_id,
    role,
    funeral_homes ( name )
  `)
  .eq("user_id", user.id)
  .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error("Este usuario no está vinculado a ninguna funeraria.");
  }

  const funeralHomeSource = Array.isArray((data as any).funeral_homes)
  ? (data as any).funeral_homes[0]
  : (data as any).funeral_homes;

setCurrentRole(data.role);
setCurrentFuneralHomeId(data.funeral_home_id);
setCurrentFuneralHomeName(funeralHomeSource?.name || "");

return data;
}

async function loadFuneralHomeData(funeralHomeIdOverride?: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("No hay sesión iniciada.");

  let funeralHomeId = funeralHomeIdOverride || null;

  if (!funeralHomeId) {
    const { data: profile, error: profileError } = await supabase
      .from("funeral_home_users")
      .select("funeral_home_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile?.funeral_home_id) {
      throw new Error("No se encontró la funeraria del usuario.");
    }

    funeralHomeId = profile.funeral_home_id;
  }

  const { data, error } = await supabase
  .from("funeral_homes")
  .select("name, address, city, postal_code, phone, contact_email, website, logo_url, country, subscription_status, subscription_plan, trial_until, subscription_start, subscription_until, access_blocked")
  .eq("id", funeralHomeId)
  .maybeSingle();
  if (error) throw error;
  if (!data) return;

  setFuneralHomeNameEdit(data.name || "");
  setAddress(data.address || "");
  setCity(data.city || "");
  setPostalCode(data.postal_code || "");
  setPhone(data.phone || "");
  setContactEmail(data.contact_email || "");
  setWebsite(data.website || "");
  setCountry(data.country || "");
  setLogoUrl(data.logo_url || "");
  setCurrentSubscriptionStatus(data.subscription_status || "inactive");
setCurrentSubscriptionPlan(data.subscription_plan || "");
setCurrentTrialUntil(data.trial_until || null);
setCurrentSubscriptionStart(data.subscription_start || null);
setCurrentSubscriptionUntil(data.subscription_until || null);
setCurrentAccessBlocked(!!data.access_blocked);
}

async function updatePassword() {
  if (!newPassword || newPassword.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres");
    return;
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert("Error cambiando contraseña");
      return;
    }

    setNewPassword("");
    alert("Contraseña actualizada correctamente");
  } catch {
    alert("Error cambiando contraseña");
  }
}

async function logout() {
  await supabase.auth.signOut();
  window.location.reload();
}

  async function loadData(funeralHomeIdOverride?: string) {
    try {
      setLoading(true);
      setError("");

      const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError) throw userError;
if (!user) throw new Error("No hay sesión iniciada.");

const { data: profile, error: profileError } = await supabase
  .from("funeral_home_users")
  .select("funeral_home_id, role")
  .eq("user_id", user.id)
  .maybeSingle();

if (profileError) throw profileError;
if (!profile) throw new Error("Usuario no vinculado a funeraria.");

let pagesQuery = supabase
  .from("deceased_pages")
  .select(`
    id,
    full_name,
    custom_text,
    theme,
    status,
    closes_at,
    slug,
    access_token,
    created_at,
    funeral_home_id,
    is_searchable,
    funeral_homes ( name )
  `)
  .order("created_at", { ascending: false });

if (funeralHomeIdOverride) {
  pagesQuery = pagesQuery.eq("funeral_home_id", funeralHomeIdOverride);
} else if (profile.role !== "admin") {
  pagesQuery = pagesQuery.eq("funeral_home_id", profile.funeral_home_id);
}

const { data: pagesData, error: pagesError } = await pagesQuery;

if (pagesError) throw pagesError;

    const { data: condolencesData, error: condolencesError } = await supabase
  .from("condolences")
  .select("id, page_id, created_at, deleted_at, moderation_status");

      if (condolencesError) throw condolencesError;

 const pages = (pagesData ?? []) as DbPage[];
const condolences = (condolencesData ?? []) as Condolence[];
const countByPageId: Record<string, number> = {};
const pendingCountByPageId: Record<string, number> = {};
const rejectedCountByPageId: Record<string, number> = {};

for (const condolence of condolences) {
  if (!condolence.page_id) continue;

  countByPageId[condolence.page_id] =
    (countByPageId[condolence.page_id] || 0) + 1;

  if (condolence.moderation_status === "pending") {
    pendingCountByPageId[condolence.page_id] =
      (pendingCountByPageId[condolence.page_id] || 0) + 1;
  }

  if (
    condolence.moderation_status === "rejected" ||
    condolence.deleted_at
  ) {
    rejectedCountByPageId[condolence.page_id] =
      (rejectedCountByPageId[condolence.page_id] || 0) + 1;
  }
}


      const normalized: PageCard[] = pages.map((page) => {
        const funeralHomeSource = Array.isArray(page.funeral_homes)
          ? page.funeral_homes[0]
          : page.funeral_homes;

   return {
  id: String(page.id),
  full_name: page.full_name || "Sin nombre",
  custom_text: page.custom_text || "",
  theme: page.theme || "default",
  status: page.status || "open",
  closes_at: page.closes_at || null,
  slug: page.slug || "",
  access_token: page.access_token || "",
  created_at: page.created_at || null,
  funeral_home_name: funeralHomeSource?.name || "",
  condolences_count: countByPageId[String(page.id)] || 0,
  pending_count: pendingCountByPageId[String(page.id)] || 0,
  rejected_count: rejectedCountByPageId[String(page.id)] || 0,
  is_searchable: !!page.is_searchable,
};
      });



      setItems(normalized);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }

async function loadAdminData() {
  const res = await fetch("/.netlify/functions/getAdminOverview");
  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data?.error || "No se pudieron cargar los datos de administración."
    );
  }

  setAdminStats(data.stats);
  setAdminFuneralHomes(data.funeralHomes || []);
  setAdminSystemParticularsHome(data.systemParticularsHome || null);
}

async function loadAdminSupportData(funeralHomeId: string) {
  const res = await fetch(
    `/.netlify/functions/getSupportDashboard?funeral_home_id=${encodeURIComponent(funeralHomeId)}`
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data?.error || "No se pudieron cargar los datos del modo soporte."
    );
  }

  const home = data.funeralHome;

  setCurrentFuneralHomeId(home.id);
setCurrentFuneralHomeName(home.name || "");
setCurrentSubscriptionStatus(home.subscription_status || "inactive");
setCurrentSubscriptionPlan(home.subscription_plan || "");
setCurrentTrialUntil(home.trial_until || null);
setCurrentSubscriptionUntil(home.subscription_until || null);
setCurrentAccessBlocked(!!home.access_blocked);
setFuneralHomeNameEdit(home.name || "");
setAddress(home.address || "");
setCity(home.city || "");
setPostalCode(home.postal_code || "");
setPhone(home.phone || "");
setContactEmail(home.contact_email || "");
setWebsite(home.website || "");
setLogoUrl(home.logo_url || "");
setItems(data.items || []);
}



async function toggleFuneralHomeAccess(
  funeralHomeId: string,
  nextBlocked: boolean
) {
  try {
    const actionText = nextBlocked ? "desactivar el acceso a" : "activar el acceso a";

    const ok = window.confirm(
      `¿Seguro que quieres ${actionText} esta funeraria?`
    );

    if (!ok) return;

    const res = await fetch(
      "/.netlify/functions/toggleFuneralHomeAccess",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          funeral_home_id: funeralHomeId,
          access_blocked: nextBlocked,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cambiar el acceso.");
    }

    await loadAdminData();
  } catch (err: any) {
    console.error(err);
    alert(err?.message || "No se pudo actualizar el acceso.");
  }
}

async function handleDeleteFuneralHome(
  funeralHomeId: string,
  funeralHomeName: string
) {
  const ok = window.confirm(
    `Si continúas eliminarás todos los datos relacionados con esta funeraria.\n\n¿Estás seguro?\n\nFuneraria: "${funeralHomeName}"`
  );

  if (!ok) return;

  try {
    const {
  data: { session },
} = await supabase.auth.getSession();


const res = await fetch("/.netlify/functions/deleteFuneralHome", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || ""}`,
  },
  body: JSON.stringify({
    funeral_home_id: funeralHomeId,
  }),
});

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo eliminar la funeraria.");
    }

    if (isAdminSupportView) {
      setAdminViewingFuneralHomeId(null);
      setAdminViewingFuneralHomeName("");
      await loadAdminData();
      return;
    }

    await loadAdminData();
    alert("Funeraria eliminada correctamente.");
  } catch (err: any) {
    console.error(err);
    alert(err?.message || "No se pudo eliminar la funeraria.");
  }
}


  async function handleCreate(e: React.FormEvent) {
  e.preventDefault();
 
  if (!canCreatePage) {
  alert("Tu plan actual no permite crear más páginas este mes.");
  return;
}

  if (!fullName.trim()) {
    alert("Debes escribir el nombre del difunto.");
    return;
  }

  try {
    setSaving(true);

    const slug =
      slugify(fullName) + "-" + Date.now().toString().slice(-6);

    const accessToken =
      Math.random().toString(36).slice(2) + Date.now().toString(36);

    const closesAt = new Date();
closesAt.setDate(closesAt.getDate() + Number(closeDays));

    let photoUrl: string | null = null;

    if (photoFile) {
      const fileExt = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${slug}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("deceased-photos")
        .upload(filePath, photoFile);

      if (uploadError) {
        console.error("ERROR STORAGE FOTO:", uploadError);
        throw new Error(uploadError.message || "No se pudo subir la foto del difunto.");
      }

      const { data: publicUrlData } = supabase.storage
        .from("deceased-photos")
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error("No se pudo obtener la URL pública de la foto.");
      }

      photoUrl = publicUrlData.publicUrl;
    }

  const payload = {
  full_name: fullName.trim(),
  custom_text: customText.trim() || null,
  slug,
  access_token: accessToken,
  status: "open",
  closes_at: closesAt.toISOString(),
  theme,
  family_email: familyEmail.trim() || null,
  funeral_home_id: effectiveFuneralHomeId,
  photo_url: photoUrl,
  is_searchable: isSearchable,
};


    const isAdminCreatingInParticulars =
  isAdminSupportView &&
  effectiveFuneralHomeId === adminSystemParticularsHome?.id;

let error;

if (isAdminCreatingInParticulars) {
  const session = await supabase.auth.getSession();

  const res = await fetch("/.netlify/functions/createAdminParticularPage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.data.session?.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    error = { message: data.error };
  }

} else {
  const result = await supabase.from("deceased_pages").insert(payload);
  error = result.error;
}

    if (error) throw error;

    setFullName("");
    setCustomText("");
    setFamilyEmail("");
    setPhotoFile(null);
    setIsSearchable(false);
    setCloseDays("10");
    
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview("");

    if (createPhotoInputRef.current) {
      createPhotoInputRef.current.value = "";
    }

    setShowCreateForm(false);

    if (isAdminSupportView && adminViewingFuneralHomeId) {
  await loadAdminSupportData(adminViewingFuneralHomeId);
  await loadAdminData();
} else {
  await loadData(effectiveFuneralHomeId || undefined);
}
alert("Página creada correctamente.");
  } catch (err: any) {
    console.error(err);
    alert(
      err?.message ||
        "No se pudo crear la página. Es posible que tu tabla necesite algún campo adicional del dashboard antiguo, como funeral_home_id."
    );
  } finally {
    setSaving(false);
  }
}

async function handleDeletePage(pageId: string, fullName: string) {
  const ok = window.confirm(
    `Vas a eliminar la página de "${fullName}".\n\nSe borrarán también sus condolencias.\n\nEsta acción no se puede deshacer.\n\n¿Continuar?`
  );

  if (!ok) return;

  try {
    
setDeletingPageId(pageId);

if (isAdminSupportView) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch("/.netlify/functions/deleteSupportPage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    },
    body: JSON.stringify({
      page_id: pageId,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "No se pudo eliminar la página.");
  }

  if (adminViewingFuneralHomeId) {
    await loadAdminSupportData(adminViewingFuneralHomeId);
  } else {
    await loadData();
  }

  alert("Página eliminada correctamente.");
  return;
}

const { error: condolencesError } = await supabase
  .from("condolences")
  .delete()
  .eq("page_id", pageId);

if (condolencesError) throw condolencesError;

const { data: deletedPages, error: pageError } = await supabase
  .from("deceased_pages")
  .delete()
  .eq("id", pageId)
  .select("id");

if (pageError) throw pageError;

if (!deletedPages || deletedPages.length === 0) {
  throw new Error(
    "La página no se ha eliminado en la base de datos. Revisa permisos/policies de Supabase."
  );
}

await loadData();
alert("Página eliminada correctamente.");
    await loadData();
    alert("Página eliminada correctamente.");
  } catch (err: any) {
    console.error("Error eliminando página:", err);
    alert(err?.message || "No se pudo eliminar la página.");
  } finally {
    setDeletingPageId(null);
  }
}

async function loadMessagesForPage(pageId: string) {
  try {
    setLoadingMessagesForPage(pageId);

    if (isAdminSupportView) {
      const res = await fetch(
        `/.netlify/functions/getSupportPageMessages?page_id=${encodeURIComponent(pageId)}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudieron cargar los mensajes.");
      }

      setPageMessages((prev) => ({
        ...prev,
        [pageId]: data.published || [],
      }));

      setPendingMessagesByPage((prev) => ({
        ...prev,
        [pageId]: data.pending || [],
      }));

      setRejectedMessagesByPage((prev) => ({
        ...prev,
        [pageId]: data.rejected || [],
      }));

      return;
    }

   const { data, error } = await supabase
  .from("condolences")
  .select("id, author_name, message, photo_path, created_at, deleted_at, moderation_status, moderation_reason")
  .eq("page_id", pageId)
  .order("created_at", { ascending: false });

    if (error) throw error;

    const allMessages = data || [];

    setPageMessages((prev) => ({
      ...prev,
      [pageId]: allMessages.filter(
        (msg) => !msg.deleted_at && msg.moderation_status === "approved"
      ),
    }));

    setRejectedMessagesByPage((prev) => ({
      ...prev,
      [pageId]: allMessages.filter(
        (msg) => !!msg.deleted_at || msg.moderation_status === "rejected"
      ),
    }));
  } catch (err: any) {
    console.error("Error cargando mensajes:", err);
    alert(err?.message || "No se pudieron cargar los mensajes.");
  } finally {
    setLoadingMessagesForPage(null);
  }
}

async function loadPendingMessagesForPage(pageId: string) {
  try {
    setLoadingPendingForPage(pageId);

    if (isAdminSupportView) {
      const res = await fetch(
        `/.netlify/functions/getSupportPageMessages?page_id=${encodeURIComponent(pageId)}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "No se pudieron cargar los mensajes pendientes."
        );
      }

      setPendingMessagesByPage((prev) => ({
        ...prev,
        [pageId]: data.pending || [],
      }));

      setRejectedMessagesByPage((prev) => ({
        ...prev,
        [pageId]: data.rejected || [],
      }));

      if (!pageMessages[pageId]) {
        setPageMessages((prev) => ({
          ...prev,
          [pageId]: data.published || [],
        }));
      }

      return;
    }

    const { data, error } = await supabase
  .from("condolences")
  .select("id, author_name, message, photo_path, created_at, moderation_status, moderation_reason, deleted_at")
  .eq("page_id", pageId)
  .is("deleted_at", null)
  .eq("moderation_status", "pending")
  .order("created_at", { ascending: false });

    if (error) throw error;

    setPendingMessagesByPage((prev) => ({
      ...prev,
      [pageId]: data || [],
    }));
  } catch (err: any) {
    console.error("Error cargando mensajes pendientes:", err);
    alert(err?.message || "No se pudieron cargar los mensajes pendientes.");
  } finally {
    setLoadingPendingForPage(null);
  }
}

async function toggleModerationPanel(pageId: string) {
  if (moderationPageId === pageId) {
    setModerationPageId(null);
    return;
  }

  setModerationPageId(pageId);

  await Promise.all([
    !pageMessages[pageId] ? loadMessagesForPage(pageId) : Promise.resolve(),
    loadPendingMessagesForPage(pageId),
  ]);
}

async function handleDeleteMessage(messageId: string, pageId: string) {
  const ok = window.confirm(
    "¿Seguro que quieres eliminar este mensaje?\n\nDejará de verse en la página pública."
  );

  if (!ok) return;

  try {
    setDeletingMessageId(messageId);

    if (isAdminSupportView) {
      const res = await fetch("/.netlify/functions/moderateSupportCondolence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          action: "delete",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo eliminar el mensaje.");
      }
    } else {
      const { error } = await supabase
        .from("condolences")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;
    }

    const wasPending = (pendingMessagesByPage[pageId] || []).some(
      (msg) => msg.id === messageId
    );

    setPageMessages((prev) => ({
      ...prev,
      [pageId]: (prev[pageId] || []).filter((msg) => msg.id !== messageId),
    }));

    setPendingMessagesByPage((prev) => ({
      ...prev,
      [pageId]: (prev[pageId] || []).filter((msg) => msg.id !== messageId),
    }));

    setRejectedMessagesByPage((prev) => ({
  ...prev,
  [pageId]: (prev[pageId] || []).filter((msg) => msg.id !== messageId),
}));

    setItems((prev) =>
      prev.map((item) =>
        item.id === pageId
          ? {
              ...item,
              condolences_count: Math.max(0, item.condolences_count - 1),
              pending_count: Math.max(
                0,
                wasPending ? item.pending_count - 1 : item.pending_count
              ),
            }
          : item
      )
    );

   if (isAdminSupportView && adminViewingFuneralHomeId) {
  await loadAdminSupportData(adminViewingFuneralHomeId);
  await Promise.all([
    loadMessagesForPage(pageId),
    loadPendingMessagesForPage(pageId),
  ]);
} else {
  await Promise.all([
    loadMessagesForPage(pageId),
    loadPendingMessagesForPage(pageId),
    loadData(effectiveFuneralHomeId || undefined),
  ]);
}
  } catch (err: any) {
    console.error("Error eliminando mensaje:", err);
    alert(err?.message || "No se pudo eliminar el mensaje.");
  } finally {
    setDeletingMessageId(null);
  }
}


async function handleApproveMessage(messageId: string, pageId: string) {
  try {
    setDeletingMessageId(messageId);

    if (isAdminSupportView) {
      const res = await fetch("/.netlify/functions/moderateSupportCondolence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          action: "approve",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo aprobar el mensaje.");
      }
    } else {
    const { error } = await supabase
  .from("condolences")
  .update({
    moderation_status: "approved",
    moderation_reason: null,
    deleted_at: null,
  })
  .eq("id", messageId);

      if (error) throw error;
    }
const approvedMsg =
  (pendingMessagesByPage[pageId] || []).find((msg) => msg.id === messageId) ||
  (rejectedMessagesByPage[pageId] || []).find((msg) => msg.id === messageId);

    setPendingMessagesByPage((prev) => ({
      ...prev,
      [pageId]: (prev[pageId] || []).filter((msg) => msg.id !== messageId),
    }));
    setRejectedMessagesByPage((prev) => ({
  ...prev,
  [pageId]: (prev[pageId] || []).filter((msg) => msg.id !== messageId),
}));

    if (approvedMsg) {
   setPageMessages((prev) => ({
  ...prev,
  [pageId]: [
    {
      ...approvedMsg,
      moderation_status: "approved",
      moderation_reason: null,
      deleted_at: null,
    },
    ...(prev[pageId] || []),
  ],
}));
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === pageId
          ? {
              ...item,
              pending_count: Math.max(0, item.pending_count - 1),
            }
          : item
      )
    );

  if (isAdminSupportView && adminViewingFuneralHomeId) {
  await loadAdminSupportData(adminViewingFuneralHomeId);
  await Promise.all([
    loadMessagesForPage(pageId),
    loadPendingMessagesForPage(pageId),
  ]);
} else {
  await Promise.all([
    loadMessagesForPage(pageId),
    loadPendingMessagesForPage(pageId),
    loadData(effectiveFuneralHomeId || undefined),
  ]);
}
  } catch (err: any) {
    console.error("Error aprobando mensaje:", err);
    alert(err?.message || "No se pudo aprobar el mensaje.");
  } finally {
    setDeletingMessageId(null);
  }
}


async function saveFuneralHomeData() {
  if (!currentFuneralHomeId) {
    alert("No se encontró la funeraria actual.");
    return;
  }

  try {
    setSavingFuneralHome(true);

    const { error } = await supabase
      .from("funeral_homes")
      .update({
        name: funeralHomeNameEdit.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        postal_code: postalCode.trim() || null,
        phone: phone.trim() || null,
        contact_email: contactEmail.trim() || null,
        country: country || null,
        website: website.trim() || null,
        logo_url: logoUrl.trim() || null,
      })
      .eq("id", currentFuneralHomeId);

    if (error) throw error;

    setCurrentFuneralHomeName(funeralHomeNameEdit.trim());
    alert("Datos de la funeraria guardados.");
    if (logoInputRef.current && !logoUrl.trim()) {
  logoInputRef.current.value = "";
}
  } catch (err: any) {
    console.error(err);
    alert(err?.message || "No se pudieron guardar los datos.");
  } finally {
    setSavingFuneralHome(false);
  }
}
 
async function handleLogoUpload(file: File) {
  try {
    setUploadingLogo(true);
    setLogoFileError("");

    if (!currentFuneralHomeId) {
      throw new Error("No se encontró la funeraria actual.");
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
    const fileName = `${currentFuneralHomeId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("funeral-logos")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("funeral-logos")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("No se pudo obtener la URL pública del logo.");
    }

    setLogoUrl(data.publicUrl);
  } catch (err: any) {
    console.error(err);
    setLogoFileError(err?.message || "No se pudo subir el logo.");
  } finally {
    setUploadingLogo(false);
  }
}

async function closePage(pageId: string, pageName: string) {
  const ok = window.confirm(
    `¿Seguro que quieres cerrar la página de "${pageName}" y generar el PDF ahora?`
  );
  if (!ok) return;

  try {
    if (isAdminSupportView) {
      const res = await fetch("/.netlify/functions/updateSupportPageStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId,
          status: "closed",
        }),
      });

      const rawText = await res.text();

      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { error: rawText || "Respuesta no válida del servidor" };
      }

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cerrar la página.");
      }
    } else {
      const { error: updateError } = await supabase
        .from("deceased_pages")
        .update({ status: "closed" })
        .eq("id", pageId);

      if (updateError) throw updateError;
    }

    const pdfRes = await fetch("/.netlify/functions/generatePdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId }),
    });

    const pdfData = await pdfRes.json().catch(() => ({}));

    if (!pdfRes.ok) {
      throw new Error(
        pdfData?.error || "La página se cerró, pero no se pudo generar el PDF."
      );
    }

    if (isAdminSupportView && adminViewingFuneralHomeId) {
      await loadAdminSupportData(adminViewingFuneralHomeId);
    } else {
      await loadData();
    }

    const pdfUrl = await waitForPdfLink(pageId);

    if (pdfUrl) {
      const wantsOpen = window.confirm(
        "Página cerrada y PDF generado correctamente.\n\n¿Quieres ver el PDF ahora?"
      );

      if (wantsOpen) {
        window.open(pdfUrl, "_blank");
      }
    } else {
      alert(
        "Página cerrada y PDF generado correctamente, pero todavía no se pudo abrir automáticamente.\n\nPuedes verlo después con el botón 'Generar PDF'."
      );
    }
  } catch (err: any) {
    console.error(err);
    alert(err?.message || "No se pudo cerrar la página.");
  }
}

async function generatePdfNow(pageId: string, pageName: string) {
  try {
    const ok = window.confirm(
      `¿Quieres generar ahora el PDF de ${pageName}?`
    );
    if (!ok) return;

    const generateRes = await fetch("/.netlify/functions/generatePdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pageId,
      }),
    });

    const generateData = await generateRes.json().catch(() => ({}));

    if (!generateRes.ok) {
      throw new Error(generateData?.error || "No se pudo generar el PDF.");
    }

    const linkRes = await fetch(
      `/.netlify/functions/getPdfLink?pageId=${encodeURIComponent(pageId)}`
    );

    const linkData = await linkRes.json().catch(() => ({}));

    if (!linkRes.ok) {
      throw new Error(linkData?.error || "El PDF se generó, pero no se pudo obtener el enlace.");
    }

    const pdfUrl =
      linkData?.pdfUrl ||
      linkData?.url ||
      linkData?.link ||
      linkData?.signedUrl;

    if (!pdfUrl) {
      throw new Error("El PDF se generó, pero no se encontró la URL del archivo.");
    }

    window.open(pdfUrl, "_blank");
  } catch (err: any) {
    console.error(err);
    alert(err?.message || "No se pudo generar o abrir el PDF.");
  }
}
 
async function waitForPdfLink(pageId: string, attempts = 6, delayMs = 1200) {
  for (let i = 0; i < attempts; i++) {
    try {
      const linkRes = await fetch(
        `/.netlify/functions/getPdfLink?pageId=${encodeURIComponent(pageId)}`
      );

      const linkData = await linkRes.json().catch(() => ({}));

      if (linkRes.ok) {
        const pdfUrl =
          linkData?.pdfUrl ||
          linkData?.url ||
          linkData?.link ||
          linkData?.signedUrl ||
          "";

        if (pdfUrl) {
          return pdfUrl;
        }
      }
    } catch (err) {
      console.error("Esperando enlace del PDF...", err);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return "";
}

async function reopenPage(pageId: string, pageName: string) {
  const ok = window.confirm(
    `¿Quieres reabrir la página de ${pageName}?`
  );
  if (!ok) return;

  try {
    if (isAdminSupportView) {
      const res = await fetch("/.netlify/functions/updateSupportPageStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId,
          status: "open",
        }),
      });

      const rawText = await res.text();

      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { error: rawText || "Respuesta no válida del servidor" };
      }

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo reabrir la página.");
      }
    } else {
     const newCloseDate = new Date();
newCloseDate.setDate(newCloseDate.getDate() + 7);

const { error } = await supabase
  .from("deceased_pages")
  .update({
    status: "open",
    closes_at: newCloseDate.toISOString(),
  })
  .eq("id", pageId);

      if (error) throw error;
    }

    if (isAdminSupportView && adminViewingFuneralHomeId) {
      await loadAdminSupportData(adminViewingFuneralHomeId);
    } else {
      await loadData();
    }

    alert("Página reabierta.");
  } catch (err: any) {
    console.error(err);
    alert(err?.message || "No se pudo reabrir la página.");
  }
}

  function getPublicUrl(item: PageCard) {
  return `${siteBase}/p/${item.slug}?token=${item.access_token}`;
}

  async function copyLink(item: PageCard) {
    try {
      await navigator.clipboard.writeText(getPublicUrl(item));
      alert("Enlace copiado.");
    } catch (err) {
      console.error(err);
      alert("No se pudo copiar el enlace.");
    }
  }

  function openPage(item: PageCard) {
    window.open(getPublicUrl(item), "_blank");
  }

  function openQr(item: PageCard) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      getPublicUrl(item)
    )}`;
    window.open(qrUrl, "_blank");
  }

function openFuneralHomeSupportView(homeId: string, homeName: string) {
  setAdminViewingFuneralHomeId(homeId);
  setAdminViewingFuneralHomeName(homeName);
}

async function startCheckout(plan: "basic" | "pro" | "unlimited") {
  try {
    const res = await fetch("/.netlify/functions/createCheckoutSession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan,
        funeralHomeId: currentFuneralHomeId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo iniciar el pago.");
    }

    window.location.href = data.url;
  } catch (err: any) {
    alert(err?.message || "No se pudo iniciar el pago.");
  }
}

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.reload();
}

  const filteredItems = useMemo(() => {
  return [...items]
    .filter((item) => {
      const matchesSearch =
        item.full_name.toLowerCase().includes(search.toLowerCase()) ||
        item.funeral_home_name.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ? true : item.status === filter;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aIsOpen = a.status === "open" ? 0 : 1;
      const bIsOpen = b.status === "open" ? 0 : 1;

      if (aIsOpen !== bIsOpen) {
        return aIsOpen - bIsOpen;
      }

      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

      return bTime - aTime;
    });
}, [items, search, filter]);

const openItemsCount = filteredItems.filter((x) => x.status === "open").length;
const closedItemsCount = filteredItems.length - openItemsCount;

const totalPages = items.length;
const openPages = items.filter((x) => x.status === "open").length;
const closedPages = items.filter((x) => x.status === "closed").length;
const totalCondolences = items.reduce(
  (acc, item) => acc + item.condolences_count,
  0
);
 
const nowDate = new Date();

const billingCycleStart = currentSubscriptionStart
  ? new Date(currentSubscriptionStart)
  : new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);

const billingCycleEnd = currentSubscriptionUntil
  ? new Date(currentSubscriptionUntil)
  : null;

const pagesThisMonth = items.filter((item) => {
  if (!item.created_at) return false;

  const createdAt = new Date(item.created_at);

  if (billingCycleEnd) {
    return createdAt >= billingCycleStart && createdAt < billingCycleEnd;
  }

  return createdAt >= billingCycleStart;
}).length;

const isTrialActive =
  currentSubscriptionStatus === "trial" &&
  !!currentTrialUntil &&
  new Date(currentTrialUntil).getTime() > Date.now();

const isPaidActive =
  currentSubscriptionStatus === "active" &&
  (!currentSubscriptionUntil ||
    new Date(currentSubscriptionUntil).getTime() > Date.now());

const normalizedPlan = (currentSubscriptionPlan || "").trim().toLowerCase();

const hasCreationAccess = isTrialActive || isPaidActive;

const currentPlanLimit = !hasCreationAccess
  ? 0
  : isTrialActive
  ? 3
  : normalizedPlan === "unlimited"
  ? null
  : normalizedPlan === "pro"
  ? 20
  : normalizedPlan === "basic"
  ? 10
  : 0;

    const isCurrentBasicPlan = normalizedPlan === "basic" && isPaidActive;
const isCurrentProPlan = normalizedPlan === "pro" && isPaidActive;
const isCurrentUnlimitedPlan = normalizedPlan === "unlimited" && isPaidActive;

const getRenewalDaysText = (dateString: string | null) => {
  if (!dateString) return "";

  const today = new Date();
  const renewalDate = new Date(dateString);

  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const renewalOnly = new Date(
    renewalDate.getFullYear(),
    renewalDate.getMonth(),
    renewalDate.getDate()
  );

  const diffMs = renewalOnly.getTime() - todayOnly.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Suscripción vencida";
  if (diffDays === 0) return "Renueva hoy";
  if (diffDays === 1) return "Renueva en 1 día";

  return `Renueva en ${diffDays} días`;
};

const renewalDaysText = isTrialActive
  ? getRenewalDaysText(currentTrialUntil)
  : getRenewalDaysText(currentSubscriptionUntil);

const pagesRemainingThisMonth =
  currentPlanLimit === null
    ? null
    : Math.max(currentPlanLimit - pagesThisMonth, 0);

const monthlyUsageText = !hasCreationAccess
  ? "Para crear nuevas páginas, debes activar un plan de suscripción."
  : currentPlanLimit === null
  ? `Páginas creadas en tu ciclo actual: ${pagesThisMonth} (ilimitado)`
  : `Páginas creadas en tu ciclo actual: ${pagesThisMonth} / ${currentPlanLimit}`;

const planLimitWarningText = !hasCreationAccess
  ? "Puedes seguir gestionando tus páginas ya creadas."
  : currentPlanLimit === null
  ? "Tu plan no tiene límite mensual"
  : pagesRemainingThisMonth === 0
  ? "Has alcanzado el límite mensual de tu plan"
  : pagesRemainingThisMonth === 1
  ? "⚠️ Te queda 1 página disponible este mes"
  : pagesRemainingThisMonth !== null && pagesRemainingThisMonth <= 3
  ? `⚠️ Te quedan ${pagesRemainingThisMonth} páginas disponibles en tu ciclo actual`
  : `Te quedan ${pagesRemainingThisMonth} páginas disponibles en tu ciclo actual`;

const canCreatePage =
  (isTrialActive &&
    (currentPlanLimit === null || pagesThisMonth < currentPlanLimit)) ||
  (isPaidActive &&
    (currentPlanLimit === null || pagesThisMonth < currentPlanLimit));

 const isAdminSupportView =
  currentRole === "admin" && !!adminViewingFuneralHomeId;

const effectiveFuneralHomeId =
  isAdminSupportView ? adminViewingFuneralHomeId : currentFuneralHomeId;



const shouldShowExpiredAccessGate =
  !loading &&
  currentRole === "funeral_home" &&
  !isTrialActive &&
  !isPaidActive &&
  !allowExpiredAccess;

const adminTrialCount = adminFuneralHomes.filter(
  (home) => (home.subscription_status || "").toLowerCase() === "trial"
).length;

const adminBasicCount = adminFuneralHomes.filter(
  (home) =>
    (home.subscription_status || "").toLowerCase() === "active" &&
    (home.subscription_plan || "").toLowerCase() === "basic"
).length;

const adminProCount = adminFuneralHomes.filter(
  (home) =>
    (home.subscription_status || "").toLowerCase() === "active" &&
    (home.subscription_plan || "").toLowerCase() === "pro"
).length;

const adminUnlimitedCount = adminFuneralHomes.filter(
  (home) =>
    (home.subscription_status || "").toLowerCase() === "active" &&
    (home.subscription_plan || "").toLowerCase() === "unlimited"
).length;

const filteredAdminFuneralHomes = adminFuneralHomes.filter((home) => {
  const matchesSearch = (home.name || "")
    .toLowerCase()
    .includes(adminSearch.toLowerCase());

  const matchesCountry =
    !adminCountryFilter || (home.country || "") === adminCountryFilter;

  return matchesSearch && matchesCountry;
});

const groupedAdminFuneralHomes = filteredAdminFuneralHomes.reduce(
  (acc: Record<string, any[]>, home: any) => {
    const key = home.country || "Sin país";
    if (!acc[key]) acc[key] = [];
    acc[key].push(home);
    return acc;
  },
  {}
);

const countryOrder = ["España", "Argentina", "Chile", "Colombia", "México"];

const countryFlags: Record<string, string> = {
  España: "🇪🇸",
  Argentina: "🇦🇷",
  Chile: "🇨🇱",
  Colombia: "🇨🇴",
  México: "🇲🇽",
  "Sin país": "🌐",
};

const [selectedYear, selectedMonth] = adminSelectedMonth.split("-").map(Number);
const monthNames = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const selectedMonthName = monthNames[selectedMonth - 1];

const startOfSelectedMonth = new Date(selectedYear, selectedMonth - 1, 1);
const endOfSelectedMonth = new Date(selectedYear, selectedMonth, 1);

const countryBusinessStats = countryOrder.map((countryName) => {
  const homesInCountry = adminFuneralHomes.filter(
  (home) => home.country === countryName
);

  const activeHomes = homesInCountry.filter(
    (home) => (home.subscription_status || "").toLowerCase() === "active"
  );

  const newPaidThisMonth = activeHomes.filter((home) => {
    if (!home.subscription_started_at) return false;
    const startedAt = new Date(home.subscription_started_at);
    return startedAt >= startOfSelectedMonth && startedAt < endOfSelectedMonth;
  });

  const totalActive = activeHomes.length;
  const totalNewPaidThisMonth = newPaidThisMonth.length;

  const commissionNew = totalNewPaidThisMonth * 50;
  const commissionBase = totalActive * 7;
  const commissionTotal = commissionNew + commissionBase;

  return {
    countryName,
    totalActive,
    totalNewPaidThisMonth,
    commissionNew,
    commissionBase,
    commissionTotal,
  };
});

if (shouldShowExpiredAccessGate) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 55%, #e8edf5 100%)",
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(255,255,255,0.75)",
          borderRadius: 28,
          boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
          padding: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 12,
            letterSpacing: "-0.02em",
          }}
        >
          Tu plan ha finalizado
        </div>

        <div
          style={{
            fontSize: 15,
            color: "#475569",
            lineHeight: 1.8,
            marginBottom: 22,
          }}
        >
          Tu cuenta sigue existiendo y puedes acceder a tus páginas ya creadas.
          <br />
          <br />
          Para crear nuevas páginas, debes activar un plan de suscripción.
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAllowExpiredAccess(true);
              setTimeout(() => {
                document
                  .getElementById("plans-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 14px 30px rgba(15,23,42,0.16)",
            }}
          >
            Activar un plan
          </button>

          <button
            type="button"
            onClick={() => setAllowExpiredAccess(true)}
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: "1px solid #dbe3ee",
              background: "white",
              color: "#0f172a",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Acceder a mis páginas
          </button>
        </div>
      </div>
    </div>
  );
}

if (currentRole === "admin" && !isAdminSupportView) {


  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 55%, #e8edf5 100%)",
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 24,
            padding: 28,
            borderRadius: 30,
            background:
  currentRole === "admin"
    ? "linear-gradient(135deg, #ff0000 0%, #02ffff 100%)"
    : "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
            color: "#fff",
            boxShadow: "0 30px 80px rgba(15,23,42,0.22)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -60,
              top: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 100,
              bottom: -80,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />

          

          {isMobile && (
  <div
    style={{
      position: "relative",
      zIndex: 4,
      display: "flex",
      justifyContent: "flex-start",
      marginBottom: 14,
    }}
  >
    <button
      onClick={handleLogout}
      style={{
        border: "1px solid rgba(255,255,255,0.3)",
        background: "rgba(255,255,255,0.15)",
        color: "#fff",
        borderRadius: 10,
        padding: "8px 14px",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        backdropFilter: "blur(4px)",
      }}
    >
      Salir
    </button>
  </div>
)}

          <div style={{ position: "relative", zIndex: 1 }}>

{!isMobile && (
  <img
    src={logoEdep}
    alt="E-Dep"
    style={{
      position: "absolute",
      right: 150,
      top: 24,
      width: 160,
      opacity: 0.24,
      pointerEvents: "none",
    }}
  />
)}

  {!isMobile && (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 25
,
      }}
    >
      <button
        onClick={handleLogout}
        style={{
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          borderRadius: 10,
          padding: "8px 14px",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          backdropFilter: "blur(4px)",
        }}
      >
        Salir
      </button>
    </div>
  )}


<div
  style={{
    display: "block",
    textAlign: "center",
    marginBottom: 14,
  }}
>
  <div
    style={{
      display: "inline-block",
      padding: isMobile ? "10px 18px" : "14px 30px",
      borderRadius: 14,
      background: "rgba(255,255,255,0.18)",
      border: "1px solid rgba(255,255,255,0.25)",
      fontSize: isMobile ? 15 : 28,
      fontWeight: 800,
      letterSpacing: "0.02em",
      backdropFilter: "blur(6px)",
    }}
  >
    E-Dep.org
  </div>

  <div
    style={{
      fontSize: isMobile ? 13 : 20,
      marginTop: 6,
      opacity: 0.85,
      fontWeight: 900,
    }}
  >
    Libro de condolencias digital
  </div>
</div>

            <h1
              style={{
                margin: 0,
                fontSize: 36,
                lineHeight: 1.05,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >

           
              Panel de administrador
            </h1>

            <p
              style={{
                marginTop: 12,
                marginBottom: 0,
                maxWidth: 820,
                color: "rgba(255,255,255,0.82)",
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              Supervisa funerarias registradas, estado de suscripción y actividad
              general de la plataforma desde un único panel centralizado.
            </p>
          </div>
        </div>

  
<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, 1fr)"
      : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: isMobile ? 10 : 16,
    marginBottom: 24,
  }}
>
  {/* Funerarias */}
  <StatCard
    title="Funerarias"
    value={String(adminStats.totalFuneralHomes)}
    subtitle="Cuentas registradas"
    isMobile={isMobile}
  />

  {/* Planes */}
  <div
    style={{
      borderRadius: 18,
      padding: 16,
      background: "white",
      boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
      border: "1px solid rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontSize: 14,
    }}
  >
    <div style={{ fontWeight: 700, marginBottom: 6 }}>Planes</div>

    <div>Trial: {adminTrialCount}</div>
    <div>Basic: {adminBasicCount}</div>
    <div>Pro: {adminProCount}</div>
    <div>Ilimitado: {adminUnlimitedCount}</div>
  </div>

  {/* Resto stats */}
  <div
  style={{
    borderRadius: 18,
    padding: 16,
    background: "white",
    boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
    border: "1px solid rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 14,
  }}
>
  <div style={{ fontWeight: 700, marginBottom: 6 }}>
    Páginas
  </div>

  <div>Totales: {adminStats.totalPages}</div>
  <div>Abiertas: {adminStats.openPages}</div>
  <div>Cerradas: {adminStats.closedPages}</div>
</div>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
    marginBottom: 24,
  }}
>
  {countryBusinessStats.map((stat) => (
    <div
      key={stat.countryName}
      style={{
  background:
    stat.commissionTotal > 0
      ? "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(236,253,245,0.96) 100%)"
      : "rgba(255,255,255,0.84)",
  backdropFilter: "blur(12px)",
  border:
    stat.commissionTotal > 0
      ? "1px solid rgba(16,185,129,0.30)"
      : "1px solid rgba(255,255,255,0.72)",
  borderRadius: 22,
  padding: 18,
  boxShadow:
    stat.commissionTotal > 0
      ? "0 18px 36px rgba(16,185,129,0.10)"
      : "0 14px 30px rgba(15,23,42,0.06)",
}}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          marginBottom: 12,
          color: "#0f172a",
        }}
      >
        {countryFlags[stat.countryName] || "🌐"} {stat.countryName}

<div
  style={{
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 500,
  }}
>
  Comisiones calculadas para {stat.countryName} en el mes {selectedMonthName} de {selectedYear}
</div>

{stat.commissionTotal > 0 && (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(16,185,129,0.12)",
      color: "#047857",
      fontSize: 12,
      fontWeight: 800,
    }}
  >
    💶 Generando comisión
  </div>
)}
      </div>

      <div style={{ display: "grid", gap: 6, fontSize: 14, color: "#334155" }}>
        <div>Activas: {stat.totalActive}</div>
        <div>Nuevas este mes: {stat.totalNewPaidThisMonth}</div>
        <div>Comisión nuevas: {stat.commissionNew}€</div>
        <div>Comisión base: {stat.commissionBase}€</div>
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid #e2e8f0",
          fontSize: 16,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        Total comisión: {stat.commissionTotal}€
      </div>
    </div>
  ))}
</div>

        <div
          style={{
            background: "rgba(255,255,255,0.84)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.75)",
            borderRadius: 24,
            boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
            padding: 20,
          }}
        >
         
           
{adminSystemParticularsHome ? (
  <div
    style={{
      marginBottom: 24,
      background: "rgba(255,255,255,0.84)",
      backdropFilter: "blur(14px)",
      border: "1px solid rgba(255,255,255,0.75)",
      borderRadius: 24,
      boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
      padding: 20,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          Particulares E-Dep
        </h2>

        <p
          style={{
            margin: "6px 0 0 0",
            color: "#64748b",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Espacio interno del sistema donde se agrupan todas las páginas creadas por particulares.
        </p>
      </div>

      <button
        onClick={() =>
          openFuneralHomeSupportView(
            adminSystemParticularsHome.id,
            adminSystemParticularsHome.name || "Particulares E-Dep"
          )
        }
        style={primarySmallButtonStyle}
      >
        Ver particulares
      </button>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(140px, 1fr))",
        gap: 12,
        marginTop: 18,
      }}
    >
      <MiniInfo
        label="Páginas"
        value={String(adminSystemParticularsHome.total_pages || 0)}
      />
      <MiniInfo
        label="Abiertas"
        value={String(adminSystemParticularsHome.open_pages || 0)}
      />
      <MiniInfo
        label="Cerradas"
        value={String(adminSystemParticularsHome.closed_pages || 0)}
      />
      <MiniInfo
        label="Mensajes"
        value={String(adminSystemParticularsHome.total_condolences || 0)}
      />
    </div>
  </div>
) : null}

<div
  style={{
    marginBottom: 18,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 220px 180px",
    gap: 10,
  }}
>
  <input
    value={adminSearch}
    onChange={(e) => setAdminSearch(e.target.value)}
    placeholder="Buscar funeraria..."
    style={{
      ...inputStyle,
      width: "100%",
      padding: "12px 14px",
    }}
  />

  <select
    value={adminCountryFilter}
    onChange={(e) => setAdminCountryFilter(e.target.value)}
    style={{
      ...inputStyle,
      width: "100%",
      padding: "12px 14px",
      appearance: "auto",
      background: "rgba(255,255,255,0.95)",
    }}
  >
    <option value="">Todos los países</option>
    <option value="España">España</option>
    <option value="Argentina">Argentina</option>
    <option value="Chile">Chile</option>
    <option value="Colombia">Colombia</option>
    <option value="México">México</option>
  </select>

  <input
    type="month"
    value={adminSelectedMonth}
    onChange={(e) => setAdminSelectedMonth(e.target.value)}
    style={{
      ...inputStyle,
      width: "100%",
      padding: "12px 14px",
      background: "rgba(255,255,255,0.95)",
    }}
  />
</div>

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap",
  }}
>
  <div>
    <h2
      style={{
        margin: 0,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: "-0.02em",
      }}
    >
      Funerarias registradas
    </h2>
    <p
      style={{
        margin: "6px 0 0 0",
        color: "#64748b",
        fontSize: 14,
      }}
    >
      Vista general del uso de la plataforma por cada funeraria.
    </p>
  </div>

  <div
    style={{
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
    }}
  >
    <button onClick={loadAdminData} style={filterStyle}>
      Actualizar
    </button>
  </div>
</div>
   
   
{filteredAdminFuneralHomes.length === 0 ? (
  <div style={panelStyle}>No hay funerarias registradas.</div>
) : (
  <div style={{ display: "grid", gap: 24 }}>
    
{Object.entries(groupedAdminFuneralHomes)
  .sort(([a], [b]) => {
    const indexA = countryOrder.indexOf(a);
    const indexB = countryOrder.indexOf(b);

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  })
  .map(([countryName, homes]) => (

      <div key={countryName}>
        <div
          style={{
            marginBottom: 12,
            fontSize: 18,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          {countryFlags[countryName] || "🌐"} {countryName}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(320px, 1fr))",
            gap: isMobile ? 14 : 18,
          }}
        >
          {(homes as any[]).map((home) => {
            const homeStatus = (home.subscription_status || "").toLowerCase();

const nowTs = Date.now();
const trialUntilTs = home.trial_until
  ? new Date(home.trial_until).getTime()
  : 0;

const subscriptionUntilTs = home.subscription_until
  ? new Date(home.subscription_until).getTime()
  : 0;

const isTrial = homeStatus === "trial" && trialUntilTs > nowTs;

const isActive =
  homeStatus === "active" &&
  (!home.subscription_until || subscriptionUntilTs > nowTs);

            const statusLabel = isActive
              ? "Activa"
              : isTrial
              ? "En prueba"
              : "Inactiva";

            const accessLabel = home.access_blocked
              ? "Acceso bloqueado"
              : "Acceso permitido";

            const accessColor = home.access_blocked ? "#991b1b" : "#065f46";
            const accessBg = home.access_blocked
              ? "rgba(239,68,68,0.12)"
              : "rgba(16,185,129,0.15)";

            const statusBg = isActive
              ? "rgba(16,185,129,0.15)"
              : isTrial
              ? "rgba(245,158,11,0.15)"
              : "rgba(239,68,68,0.12)";

            const statusColor = isActive
              ? "#065f46"
              : isTrial
              ? "#92400e"
              : "#991b1b";

            const statusDot = isActive
              ? "#10b981"
              : isTrial
              ? "#f59e0b"
              : "#ef4444";

            const getAdminRenewalDaysText = (dateString?: string | null) => {
              if (!dateString) return "";

              const today = new Date();
              const renewalDate = new Date(dateString);

              const todayOnly = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
              );

              const renewalOnly = new Date(
                renewalDate.getFullYear(),
                renewalDate.getMonth(),
                renewalDate.getDate()
              );

              const diffMs = renewalOnly.getTime() - todayOnly.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

              if (diffDays < 0) return "Prueba vencida";
              if (diffDays === 0) return "Renueva hoy";
              if (diffDays === 1) return "Renueva en 1 día";

              return `Renueva en ${diffDays} días`;
            };

            const adminRenewalText = isTrial
              ? getAdminRenewalDaysText(home.trial_until)
              : isActive
              ? getAdminRenewalDaysText(home.subscription_until)
              : "";

            return (
              <div
                key={home.id}
                style={{
                  background: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.75)",
                  borderRadius: 24,
                  padding: "20px 20px 20px 26px",
                  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 6,
                    borderTopLeftRadius: 24,
                    borderBottomLeftRadius: 24,
                    background: isActive ? "#10b981" : isTrial ? "#f59e0b" : "#ef4444",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    right: -40,
                    top: -40,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: isActive
                      ? "rgba(16,185,129,0.12)"
                      : isTrial
                      ? "rgba(245,158,11,0.12)"
                      : "rgba(239,68,68,0.10)",
                  }}
                />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          borderRadius: 999,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          background: statusBg,
                          color: statusColor,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: statusDot,
                            display: "inline-block",
                          }}
                        />
                        {statusLabel}
                      </div>

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: 999,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          background: accessBg,
                          color: accessColor,
                        }}
                      >
                        {accessLabel}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteFuneralHome(home.id, home.name || "Funeraria")
                        }
                        style={{
                          border: "1px solid rgba(239,68,68,0.18)",
                          background: "rgba(254,242,242,0.95)",
                          color: "#b91c1c",
                          borderRadius: 10,
                          padding: "8px 12px",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Eliminar funeraria
                      </button>
                    </div>
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: 23,
                      lineHeight: 1.2,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {home.name || "Sin nombre"}
                  </h3>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    {home.country || "Sin país"}
                  </div>

                  <p
                    style={{
                      margin: "8px 0 0 0",
                      color: "#64748b",
                      fontSize: 14,
                    }}
                  >
                    Alta: {formatDate(home.created_at)}
                  </p>

                  {isTrial ? (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 16,
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.20)",
                        color: "#92400e",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
                        Prueba gratuita activa
                      </div>

                      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                        {home.trial_until
                          ? `Finaliza el ${new Date(home.trial_until).toLocaleDateString("es-ES")}`
                          : "Periodo de prueba en curso"}
                      </div>

                      {adminRenewalText ? (
                        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                          {adminRenewalText}
                        </div>
                      ) : null}
                    </div>
                  ) : isActive ? (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 16,
                        background: "rgba(16,185,129,0.08)",
                        border: "1px solid rgba(16,185,129,0.18)",
                        color: "#065f46",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
                        Plan {(home.subscription_plan || "sin plan").toString().toUpperCase()}
                        {home.subscription_until
                          ? ` · Renueva el ${new Date(home.subscription_until).toLocaleDateString("es-ES")}`
                          : ""}
                      </div>

                      {adminRenewalText ? (
                        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                          {adminRenewalText}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 12,
                        borderRadius: 16,
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.14)",
                        color: "#991b1b",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Sin suscripción activa
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: isMobile ? 8 : 12,
                      marginTop: isMobile ? 14 : 18,
                      marginBottom: isMobile ? 12 : 16,
                    }}
                  >
                    <MiniInfo
                      label="Páginas"
                      value={
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            fontWeight: 500,
                            color: "#64748b",
                          }}
                        >
                          <span>Totales: {home.total_pages || 0}</span>
                          <span>Abiertas: {home.open_pages || 0}</span>
                          <span>Cerradas: {home.closed_pages || 0}</span>
                        </div>
                      }
                    />

                    <MiniInfo
                      label="Mensajes"
                      value={
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            fontWeight: 500,
                            color: "#64748b",
                          }}
                        >
                          <span>Totales: {home.total_condolences || 0}</span>
                          <span>Publicados: {home.approved_condolences || 0}</span>
                          <span>Pendientes: {home.pending_condolences || 0}</span>
                          <span>Rechazados: {home.rejected_condolences || 0}</span>
                        </div>
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      marginTop: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() =>
                        openFuneralHomeSupportView(home.id, home.name || "Funeraria")
                      }
                      style={primarySmallButtonStyle}
                    >
                      Ver panel
                    </button>

                    {home.access_blocked ? (
                      <button
                        onClick={() => toggleFuneralHomeAccess(home.id, false)}
                        style={ghostButtonStyle}
                      >
                        Activar acceso
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleFuneralHomeAccess(home.id, true)}
                        style={dangerButtonStyle}
                      >
                        Desactivar acceso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </div>
)}
          
            
          
        </div>
      </div>
    </div>
  );
}

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 55%, #e8edf5 100%)",
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#0f172a",
      }}
    >



      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 24,
            padding: 28,
            borderRadius: 30,
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #334155 100%)",
            color: "#fff",
            boxShadow: "0 30px 80px rgba(15,23,42,0.22)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -60,
              top: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 100,
              bottom: -80,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
            }}
          />

        <div
  style={{
    position: "relative",
    zIndex: 4,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  }}
>
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    {isAdminSupportView && (
      <button
        onClick={() => {
          setAdminViewingFuneralHomeId(null);
          setAdminViewingFuneralHomeName("");
        }}
        style={{
          border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          borderRadius: 10,
          padding: "8px 14px",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          backdropFilter: "blur(4px)",
        }}
      >
        Volver al panel admin
      </button>
    )}
  </div>

  {!isMobile && (
    <button
      onClick={handleLogout}
      style={{
        border: "1px solid rgba(255,255,255,0.3)",
        background: "rgba(255,255,255,0.15)",
        color: "#fff",
        borderRadius: 10,
        padding: "8px 14px",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        backdropFilter: "blur(4px)",
      }}
    >
      Salir
    </button>
  )}
</div>

{isMobile && (
  <div
    style={{
      position: "relative",
      zIndex: 4,
      display: "flex",
      justifyContent: "flex-start",
      marginBottom: 14,
    }}
  >
    <button
      onClick={handleLogout}
      style={{
        border: "1px solid rgba(255,255,255,0.3)",
        background: "rgba(255,255,255,0.15)",
        color: "#fff",
        borderRadius: 10,
        padding: "8px 14px",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        backdropFilter: "blur(4px)",
      }}
    >
      Salir
    </button>
  </div>
)}


        
<div
  style={{
    position: "relative",
    zIndex: 2,
  }}
>
  {isMobile ? (
    <>
      <div
        style={{
          display: "block",
          textAlign: "center",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.25)",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.02em",
            backdropFilter: "blur(6px)",
          }}
        >
          E-Dep.org
        </div>

        <div
          style={{
            fontSize: 13,
            marginTop: 6,
            opacity: 0.85,
            fontWeight: 500,
          }}
        >
          Libro de condolencias digital
        </div>
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: 36,
          lineHeight: 1.05,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          textAlign: "center",
        }}
      >
        Dashboard
      </h1>

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginTop: 6,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            background: isAdminSupportView
              ? "rgba(99, 99, 105, 0.18)"
              : "rgba(255,255,255,0.3)",
            border: isAdminSupportView
              ? "3px solid rgba(247, 247, 247, 0.35)"
              : "1px solid rgb(62, 56, 56)",
            color: "#f9f9f9",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {isAdminSupportView ? "Modo soporte" : "Panel de empresa"}
        </div>
      </div>

      {logoUrl ? (
        <div
          style={{
            marginTop: 18,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 110,
              height: 110,
              margin: "0 auto 14px auto",
              background: "#ffffff",
              borderRadius: 24,
              boxShadow: "0 18px 40px rgba(15,23,42,0.22)",
              border: "1px solid rgba(255,255,255,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={logoUrl}
              alt={currentFuneralHomeName || "Logo funeraria"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: 16,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 2,
          marginBottom: 6,
          fontSize: 18,
          fontWeight: 800,
          color: "#ffffff",
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        {isAdminSupportView
          ? adminViewingFuneralHomeName || "Funeraria"
          : currentFuneralHomeName || "Tu funeraria"}
      </div>

      {isTrialActive && (
        <div
          style={{
            marginTop: 10,
            marginBottom: 10,
            padding: "10px 14px",
            borderRadius: 14,
            background: "rgb(182, 25, 25)",
            border: "1px solid rgb(255, 255, 255)",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            display: "inline-block",
          }}
        >
          {getTrialDaysText(currentTrialUntil)}
        </div>
      )}
    </>
  ) : (

<div
  style={{
    display: "grid",
    gridTemplateColumns: logoUrl
      ? "220px minmax(0, 1fr)"
      : "minmax(0, 1fr)",
    gap: logoUrl ? 42 : 0,
    alignItems: "center",
    width: "100%",
    paddingLeft: isMobile ? 0 : 68,
  }}
>
  
  
  <div>
      
 <div
  style={{
    width: 150,
    height: 150,
    borderRadius: 18,
    background: logoUrl ? "#ffffff" : "#f1f5f9",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  }}
>
  {logoUrl ? (
    <img
      src={logoUrl}
      alt="Logo funeraria"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
  ) : (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      Logo
    </div>
  )}
</div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          {isAdminSupportView
            ? adminViewingFuneralHomeName || "Funeraria"
            : currentFuneralHomeName || "Tu funeraria"}
        </div>

        {isTrialActive && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 14,
              background: "rgb(182, 25, 25)",
              border: "1px solid rgb(255, 255, 255)",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            {getTrialDaysText(currentTrialUntil)}
          </div>
        )}
      </div>

<div
  style={{
    maxWidth: 820,
    marginLeft: "auto",
    width: "100%",
    textAlign: "center",
    transform: "scale(1.35)",
    transformOrigin: "top right",
    marginTop: -180,
    
  }}
>

<div
  style={{
    transform: logoUrl ? "translateY(30px)" : "translateY(-55px)",
  }}
>
  
        <div
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.18)",
            border: "1px solid rgba(255,255,255,0.25)",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.02em",
            backdropFilter: "blur(6px)",
          }}
        >
          E-Dep.org
        </div>

        <div
          style={{
            fontSize: 14,
            marginTop: 6,
            marginBottom: 18,
            opacity: 0.85,
            fontWeight: 500,
          }}
        >
          Libro de condolencias digital
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 40,
            lineHeight: 1.05,
            fontWeight: 800,
            letterSpacing: "-0.03em",
          }}
        >
          Dashboard
        </h1>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 14,
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 999,
            background: isAdminSupportView
              ? "rgba(99, 99, 105, 0.18)"
              : "rgba(255,255,255,0.3)",
            border: isAdminSupportView
              ? "3px solid rgba(247, 247, 247, 0.35)"
              : "1px solid rgb(62, 56, 56)",
            color: "#f9f9f9",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {isAdminSupportView ? "Modo soporte" : "Panel de empresa"}
        </div>

      </div>
      </div>
    </div>
  )}



{website && !isAdminSupportView ? (
  <div
    style={{
      marginTop: 6,
      marginBottom: 10,
      fontSize: 14,
      color: "rgba(255,255,255,0.92)",
      lineHeight: 1.5,
      wordBreak: "break-word",
    }}
  >
    Web:
    <a
      href={website.startsWith("http") ? website : `https://${website}`}
      target="_blank"
      rel="noreferrer"
      style={{
        marginLeft: 6,
        color: "#ffffff",
        textDecoration: "underline",
        fontWeight: 600,
      }}
    >
      {website}
    </a>
  </div>
) : null}

            <p
              style={{
                marginTop: 12,
                marginBottom: 0,
                maxWidth: logoUrl ? 620 : 820,
                color: "rgba(255,255,255,0.82)",
                fontSize: 16,
                lineHeight: 1.6,
              }}
            >
              Gestiona páginas de condolencias. Crea nuevas páginas, comparte enlaces, genera QR y
              controla el estado de cada recuerdo.
            </p>
          </div>
        </div>

        <div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, 1fr)"
      : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: isMobile ? 10 : 16,
    marginBottom: 24,
  }}
>
          <StatCard
            title="Total páginas"
            value={String(totalPages)}
            subtitle="Páginas registradas"
            isMobile={isMobile}
          />
          <StatCard
            title="Activas"
            value={String(openPages)}
            subtitle="Estado abierto"
            isMobile={isMobile}
          />
          <StatCard
            title="Cerradas"
            value={String(closedPages)}
            subtitle="Estado cerrado"
            isMobile={isMobile}
          />
          <StatCard
            title="Mensajes"
            value={String(totalCondolences)}
            subtitle="Condolencias recibidas"
            isMobile={isMobile}
          />
        </div>



        <div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "380px 1fr",
    gridTemplateAreas: isMobile
      ? `"main"
         "sidebar"`
      : `"sidebar main"`,
    gap: isMobile ? 16 : 24,
    alignItems: "start",
  }}
>
         <div
  style={{
    gridArea: "sidebar",
    background: "rgba(255,255,255,0.84)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: 24,
    boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
    padding: 22,
    position: isMobile ? "static" : "sticky",
    top: isMobile ? undefined : 20,
  }}
>

<div style={{ marginBottom: 18 }}>
  <button
    type="button"
    onClick={() => setShowFuneralHomePanel((prev) => !prev)}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 16px",
      borderRadius: 16,
      border: "1px solid #e2e8f0",
      background: "white",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 16,
      color: "#0f172a",
      marginBottom: showFuneralHomePanel ? 14 : 0,
    }}
  >
    <span>Datos de la funeraria</span>
    <span>{showFuneralHomePanel ? "−" : "+"}</span>
  </button>

  {showFuneralHomePanel && (
    <div>
      <p
        style={{
          marginTop: 0,
          marginBottom: 20,
          color: "#475569",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      >
        Edita la información pública y de contacto de tu funeraria.
      </p>

      <FieldLabel>Nombre</FieldLabel>
      <input
        value={funeralHomeNameEdit}
        onChange={(e) => setFuneralHomeNameEdit(e.target.value)}
        placeholder="Nombre de la funeraria"
        style={inputStyle}
      />

      <FieldLabel>Dirección</FieldLabel>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Dirección"
        style={inputStyle}
      />

      <FieldLabel>Ciudad</FieldLabel>
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Ciudad"
        style={inputStyle}
      />

      <FieldLabel>Código postal</FieldLabel>
      <input
        value={postalCode}
        onChange={(e) => setPostalCode(e.target.value)}
        placeholder="Código postal"
        style={inputStyle}
      />

      <FieldLabel>Teléfono</FieldLabel>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Teléfono"
        style={inputStyle}
      />

      <FieldLabel>Email de contacto</FieldLabel>
      <input
        value={contactEmail}
        onChange={(e) => setContactEmail(e.target.value)}
        placeholder="Email de contacto"
        type="email"
        style={inputStyle}
      />

      <FieldLabel>Web</FieldLabel>
      <input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://..."
        style={inputStyle}
      />

      <FieldLabel>País</FieldLabel>
<select
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  style={{
    ...inputStyle,
    appearance: "auto",
    background: "rgba(255,255,255,0.95)",
  }}
>
  <option value="">Selecciona un país</option>
  <option value="España">España</option>
  <option value="Argentina">Argentina</option>
  <option value="Chile">Chile</option>
  <option value="Colombia">Colombia</option>
  <option value="México">México</option>
</select>

      <FieldLabel>Logo de la funeraria</FieldLabel>

    <input
  ref={logoInputRef}
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  }}
        style={{
          ...inputStyle,
          padding: 12,
          background: "white",
        }}
      />

      {uploadingLogo ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#475569",
          }}
        >
          Subiendo logo...
        </div>
      ) : null}

      {logoFileError ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "#b91c1c",
            fontWeight: 600,
          }}
        >
          {logoFileError}
        </div>
      ) : null}

   {logoUrl ? (
  <div
    style={{
      marginTop: 12,
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 120,
      flexDirection: "column",
      gap: 12,
    }}
  >
    <img
      src={logoUrl}
      alt="Vista previa del logo"
      style={{
        maxWidth: "100%",
        maxHeight: 90,
        objectFit: "contain",
        display: "block",
      }}
    />

    <button
      type="button"
      onClick={() => {
  setLogoUrl("");
  if (logoInputRef.current) {
    logoInputRef.current.value = "";
  }
}}
      style={{
        border: "1px solid rgba(239,68,68,0.18)",
        background: "rgba(254,242,242,0.95)",
        color: "#b91c1c",
        borderRadius: 10,
        padding: "8px 12px",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      Quitar logo
    </button>
  </div>
) : null}

      <button
        type="button"
        onClick={saveFuneralHomeData}
        disabled={savingFuneralHome}
        style={{
          width: "100%",
          marginTop: 16,
          border: "none",
          borderRadius: 16,
          padding: "15px 18px",
          background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: 15,
          cursor: savingFuneralHome ? "not-allowed" : "pointer",
          opacity: savingFuneralHome ? 0.7 : 1,
        }}
      >
        {savingFuneralHome ? "Guardando..." : "Guardar datos funeraria"}
      </button>

      {isAdminSupportView && currentFuneralHomeId ? (
  <button
    type="button"
    onClick={() =>
      handleDeleteFuneralHome(
        currentFuneralHomeId,
        currentFuneralHomeName || "Funeraria"
      )
    }
    style={{
      width: "100%",
      marginTop: 10,
      border: "1px solid rgba(239,68,68,0.18)",
      borderRadius: 16,
      padding: "15px 18px",
      background: "rgba(254,242,242,0.95)",
      color: "#b91c1c",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
    }}
  >
    Eliminar funeraria
  </button>
) : null}

      <div
        style={{
          height: 1,
          background: "#e2e8f0",
          marginTop: 24,
          marginBottom: 24,
        }}
      />
    </div>
  )}
</div>

<div style={{ marginBottom: 18 }}>
  <button
    type="button"
    onClick={() => setShowSubscriptionPanel((prev) => !prev)}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 16px",
      borderRadius: 16,
      border: "1px solid #e2e8f0",
      background: "white",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 16,
      color: "#0f172a",
      marginBottom: showSubscriptionPanel ? 14 : 0,
    }}
  >
    <span>Plan y suscripción</span>
    <span>{showSubscriptionPanel ? "−" : "+"}</span>
  </button>

  {showSubscriptionPanel && (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
        {isTrialActive
          ? "Prueba gratuita activa"
          : currentSubscriptionStatus === "active"
          ? currentSubscriptionPlan === "basic"
            ? "Plan Básico activo"
            : currentSubscriptionPlan === "pro"
            ? "Plan Profesional activo"
            : currentSubscriptionPlan === "unlimited"
            ? "Plan Ilimitado activo"
            : "Plan activo"
          : "Sin suscripción activa"}
      </div>

      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
        {isTrialActive
          ? currentTrialUntil
            ? `Prueba hasta ${new Date(currentTrialUntil).toLocaleDateString("es-ES")}`
            : "Prueba gratuita en curso"
          : currentSubscriptionUntil
          ? `Activo hasta ${new Date(currentSubscriptionUntil).toLocaleDateString("es-ES")}`
          : ""}
      </div>

      {renewalDaysText ? (
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color:
              renewalDaysText === "Suscripción vencida"
                ? "#b91c1c"
                : renewalDaysText === "Renueva hoy"
                ? "#b45309"
                : "#0f172a",
            marginBottom: 12,
          }}
        >
          {renewalDaysText}
        </div>
      ) : null}

      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            fontWeight: 700,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Uso mensual
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 6,
          }}
        >
          {monthlyUsageText}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color:
              currentPlanLimit === null
                ? "#475569"
                : pagesRemainingThisMonth === 0
                ? "#b91c1c"
                : pagesRemainingThisMonth !== null && pagesRemainingThisMonth <= 3
                ? "#b45309"
                : "#475569",
          }}
        >
          {planLimitWarningText}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => startCheckout("basic")}
          disabled={isCurrentBasicPlan}
          style={{
            ...planButtonStyle,
            opacity: isCurrentBasicPlan ? 0.55 : 1,
            cursor: isCurrentBasicPlan ? "not-allowed" : "pointer",
          }}
        >
          {isCurrentBasicPlan ? "Plan actual" : "Plan Básico"}
        </button>

        <button
          onClick={() => startCheckout("pro")}
          disabled={isCurrentProPlan}
          style={{
            ...planButtonStyle,
            opacity: isCurrentProPlan ? 0.55 : 1,
            cursor: isCurrentProPlan ? "not-allowed" : "pointer",
          }}
        >
          {isCurrentProPlan ? "Plan actual" : "Plan Profesional"}
        </button>

        <button
          onClick={() => startCheckout("unlimited")}
          disabled={isCurrentUnlimitedPlan}
          style={{
            ...planButtonStyle,
            opacity: isCurrentUnlimitedPlan ? 0.55 : 1,
            cursor: isCurrentUnlimitedPlan ? "not-allowed" : "pointer",
          }}
        >
          {isCurrentUnlimitedPlan ? "Plan actual" : "Plan Ilimitado"}
        </button>
      </div>
    </div>
  )}
</div>

<div style={{ marginBottom: 18 }}>
  <button
    type="button"
    onClick={() => setShowStripePanel((prev) => !prev)}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 16px",
      borderRadius: 16,
      border: "1px solid #e2e8f0",
      background: "white",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 16,
      color: "#0f172a",
      marginBottom: showStripePanel ? 14 : 0,
    }}
  >
    <span>Portal de cliente Stripe</span>
    <span>{showStripePanel ? "−" : "+"}</span>
  </button>

  {showStripePanel && (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: "#475569",
          lineHeight: 1.6,
          marginBottom: 12,
        }}
      >
        Desde aquí podrás cambiar tarjeta, descargar facturas, cambiar de plan o cancelar tu suscripción.
      </div>

    <button
  type="button"
  onClick={async () => {
    try {
      const response = await fetch(
        "/.netlify/functions/createCustomerPortalSession",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            funeralHomeId: currentFuneralHomeId,
          }),
        }
      );

      const rawText = await response.text();

      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { error: rawText || "Respuesta no válida del servidor" };
      }

      if (!response.ok) {
        console.error("Error portal Stripe:", data);
        alert(data.error || "No se pudo abrir el portal de cliente");
        return;
      }

      if (!data.url) {
        alert("Stripe no devolvió una URL válida");
        return;
      }

      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error conectando con Stripe:", error);
      alert(error?.message || "Error conectando con Stripe");
    }
  }}
  style={{
    width: "100%",
    border: "none",
    borderRadius: 16,
    padding: "15px 18px",
    background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
    color: "white",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  }}
>
  Abrir portal de cliente
</button>


    </div>
  )}
</div>

<div style={{ marginBottom: 18 }}>
  <button
    type="button"
    onClick={() => setShowSecurityPanel((prev) => !prev)}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 16px",
      borderRadius: 16,
      border: "1px solid #e2e8f0",
      background: "white",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: 16,
      color: "#0f172a",
      marginBottom: showSecurityPanel ? 14 : 0,
    }}
  >
    <span>Acceso y seguridad</span>
    <span>{showSecurityPanel ? "−" : "+"}</span>
  </button>

  {showSecurityPanel && (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>
          Email de acceso
        </div>

        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {accountEmail}
        </div>
      </div>

      <input
        type="password"
        placeholder="Nueva contraseña"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        style={inputStyle}
      />

      <button
        onClick={updatePassword}
        style={{
          width: "100%",
          marginTop: 10,
          border: "none",
          borderRadius: 16,
          padding: "14px 16px",
          background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Cambiar contraseña
      </button>

      <button
        onClick={logout}
        style={{
          width: "100%",
          marginTop: 10,
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: "14px 16px",
          background: "#f8fafc",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Cerrar sesión
      </button>
    </div>
  )}
</div>
            
          </div>
          <div
  style={{
    gridArea: "main",
    display: "grid",
    gap: 18,
    alignContent: "start",
  }}
>


  


            {/* Crear nueva página */}
            <div
              style={{
                background: "rgba(255,255,255,0.84)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.75)",
                borderRadius: 24,
                boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                marginBottom: 0,
              }}
            >



              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 18,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    Crear nueva página
                  </div>

                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    Crea una página memorial para una familia
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (showCreateForm) {
                      setFullName("");
                      setCustomText("");
                      setFamilyEmail("");
                      setPhotoFile(null);
                      if (photoPreview) {
                        URL.revokeObjectURL(photoPreview);
                      }
                      setPhotoPreview("");
                      if (createPhotoInputRef.current) {
                        createPhotoInputRef.current.value = "";
                      }
                    }
                    setShowCreateForm((prev) => !prev);
                  }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: showCreateForm ? "#111827" : "white",
                    color: showCreateForm ? "white" : "#111827",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {showCreateForm ? "Cerrar" : "Nueva página"}
                </button>
              </div>

              {showCreateForm && (
                <div style={{ padding: 18 }}>
 {!canCreatePage && (
  <div
    style={{
      background: "#fff7ed",
      border: "1px solid #fdba74",
      color: "#9a3412",
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
      fontSize: 13,
      lineHeight: 1.5,
      fontWeight: 600,
    }}
  >
    No puedes crear más páginas en este momento.
    {isTrialActive
      ? " Tu periodo gratuito te permite gestionar las páginas creadas, pero no crear nuevas. Para crear nuevas páginas, visita la pestaña Plan y suscripción."
      : currentSubscriptionStatus === "trial"
      ? " Tu prueba gratuita ha terminado."
      : currentSubscriptionStatus === "active"
      ? " Has alcanzado el límite mensual de tu plan."
      : " Tu suscripción no está activa."}
  </div>
)}
                  <form onSubmit={handleCreate}>
                    <FieldLabel>Nombre del difunto</FieldLabel>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ejemplo: Antonio García"
                      style={inputStyle}
                    />

                    <FieldLabel>Texto de la cabecera</FieldLabel>
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value.slice(0, 280))}
                      placeholder="Escribe una dedicatoria o mensaje inicial"
                      rows={5}
                      style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
                      maxLength={280}
                    />
                    <div
  style={{
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    textAlign: "right",
  }}
>
  {(customText || "").length}/280
</div>

                    <FieldLabel>Email de la familia</FieldLabel>
                    <input
                      value={familyEmail}
                      onChange={(e) => setFamilyEmail(e.target.value)}
                      placeholder="familia@ejemplo.com"
                      type="email"
                      style={inputStyle}
                    />

<FieldLabel>Duración pública de la página</FieldLabel>
<select
  value={closeDays}
  onChange={(e) => setCloseDays(e.target.value)}
  style={{
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "white",
    fontSize: 14,
  }}
>
  <option value="3">3 días</option>
  <option value="7">7 días</option>
  <option value="10">10 días</option>
</select>

<div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
  La familia decide cuánto tiempo estará visible la página antes de cerrarse automáticamente.
</div>

                    <FieldLabel>Foto del difunto</FieldLabel>
                    <input
                      ref={createPhotoInputRef}
                      type="file"
                      accept="image/*"
                  
onChange={async (e) => {
  const file = e.target.files?.[0] || null;

  if (photoPreview) {
    URL.revokeObjectURL(photoPreview);
  }

  if (!file) {
    setPhotoFile(null);
    setPhotoPreview("");
    return;
  }

  try {
    const normalized = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1800,
      useWebWorker: true,
      initialQuality: 0.9,
    });

    setPhotoFile(normalized as File);
    setPhotoPreview(URL.createObjectURL(normalized));
  } catch (err) {
    console.error("Error procesando foto del difunto:", err);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }
}}

                      style={{
                        ...inputStyle,
                        padding: 12,
                        background: "white",
                      }}
                    />

                    {photoPreview && (
                      <div style={{ marginTop: 10 }}>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#666",
                            marginBottom: 6,
                            fontWeight: 700,
                          }}
                        >
                          Vista previa
                        </div>

                        <img
                          src={photoPreview}
                          alt="Vista previa del difunto"
                          style={{
                            width: 120,
                            height: 120,
                            objectFit: "cover",
                            borderRadius: 12,
                            border: "1px solid rgba(0,0,0,0.08)",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.10)",
                            display: "block",
                          }}
                        />
                      </div>
                    )}

                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: 13, fontWeight: 700 }}>
                        Estilo de página
                      </label>

                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid rgba(0,0,0,0.15)",
                          marginTop: 6,
                        }}
                      >
                        <option value="classic">Clásico (Foto Pequeña)</option>
                        <option value="photo">Foto grande</option>
                        <option value="minimal">Minimalista (Sin foto)</option>
                      </select>
                    </div>

<div style={{ marginTop: 12 }}>
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 14,
      fontWeight: 600,
      color: "#334155",
      cursor: "pointer",
    }}
  >
    <input
      type="checkbox"
      checked={isSearchable}
      onChange={(e) => setIsSearchable(e.target.checked)}
    />
    Buscador en E-Dep.org
  </label>

  <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
    Si está activado, esta página podrá encontrarse desde el buscador público.
  </div>
</div>

                    <button
  type="submit"
  disabled={saving || !canCreatePage}
                      style={{
                        width: "100%",
                        marginTop: 16,
                        border: "none",
                        borderRadius: 16,
                        padding: "15px 18px",
                        background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 15,
                       cursor: saving || !canCreatePage ? "not-allowed" : "pointer",
                        boxShadow: "0 14px 30px rgba(15,23,42,0.18)",
                        opacity: saving || !canCreatePage ? 0.7 : 1,
                      }}
                    >
                      {saving ? "Creando..." : "Crear página"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr auto auto auto",
                gap: 12,
                alignItems: "stretch",
              }}
            >
             <input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Buscar difunto..."
  style={{
    ...inputStyle,
    gridColumn: isMobile ? "1 / -1" : undefined,
  }}
/>

              <button
                onClick={() => setFilter("all")}
                style={filter === "all" ? activeFilterStyle : filterStyle}
              >
                Todas
              </button>

              <button
                onClick={() => setFilter("open")}
                style={filter === "open" ? activeFilterStyle : filterStyle}
              >
                Activas
              </button>

              <button
                onClick={() => setFilter("closed")}
                style={filter === "closed" ? activeFilterStyle : filterStyle}
              >
                Cerradas
              </button>
            </div>

<div style={{ height: 20 }} />

            {loading ? (
              <div style={panelStyle}>Cargando dashboard...</div>
            ) : error ? (
              <div style={panelStyle}>
                <div style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={panelStyle}>No hay páginas para mostrar.</div>
            ) : (
           <div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(320px, 1fr))",
    gap: isMobile ? 14 : 18,
  }}
>



               {filteredItems.map((item, index) => {
   const moderationTotalCount =
  (item.condolences_count || 0) + (item.rejected_count || 0);
  (pendingMessagesByPage[item.id]?.length || 0) +
  (pageMessages[item.id]?.length || 0);   
   (rejectedMessagesByPage[item.id]?.length || 0);        
  const isOpen = item.status === "open";
  const showOpenHeader = index === 0 && openItemsCount > 0;
  const showClosedHeader = index === openItemsCount && closedItemsCount > 0;

                  return (
<>
  {showOpenHeader && (
    <div
      style={{
        gridColumn: "1 / -1",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.08em",
        color: "#475569",
        marginBottom: 3,
      }}
    >
      PÁGINAS ACTIVAS
    </div>
  )}

  {showClosedHeader && (
    <div
      style={{
        gridColumn: "1 / -1",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.08em",
        color: "#475569",
        marginTop: 10,
        marginBottom: 6,
      }}
    >
      PÁGINAS CERRADAS
    </div>
  )}

  

                    <div
  key={item.id}
  style={{
    background: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.75)",
    borderRadius: isMobile ? 18 : 24,
    padding: isMobile ? 14 : 20,
    boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
    position: "relative",
    overflow: "hidden",
  }}
>
                      <div
                        style={{
                          position: "absolute",
                          right: -40,
                          top: -40,
                          width: 120,
                          height: 120,
                          borderRadius: "50%",
                          background: isOpen
                            ? "rgba(16,185,129,0.12)"
                            : "rgba(239,68,68,0.10)",
                        }}
                      />

                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                            background: isOpen
                              ? "rgba(16,185,129,0.12)"
                              : "rgba(239,68,68,0.10)",
                            color: isOpen ? "#047857" : "#b91c1c",
                            marginBottom: 12,
                          }}
                        >
                          {isOpen ? "Activa" : "Cerrada"}
                        </div>

                       <div
  style={{
    marginTop: 2,
    marginBottom: 12,
    fontSize: 13,
    color: "#64748b",
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  }}
>
<span style={{ fontWeight: 600 }}>
  {item.is_searchable ? "🔍 Visible en buscador" : "🚫 Oculta del buscador"}
</span>


  {item.pending_count > 0 && (
    <span
      style={{
        background: "#fee2e2",
        color: "#b91c1c",
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      ⚠ {item.pending_count} pendientes
    </span>
  )}
</div>

                        <h3
                          style={{
                            margin: 0,
                            fontSize: 23,
                            lineHeight: 1.2,
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {item.full_name}
                        </h3>

                        {item.funeral_home_name ? (
                          <p
                            style={{
                              margin: "8px 0 0 0",
                              color: "#64748b",
                              fontSize: 14,
                            }}
                          >
                            Gestionado por {item.funeral_home_name}
                          </p>
                        ) : null}

                        <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: isMobile ? 8 : 12,
    marginTop: isMobile ? 14 : 18,
    marginBottom: isMobile ? 12 : 16,
  }}
>
                          <MiniInfo
                            label="Creada"
                            value={formatDate(item.created_at)}
                          />
                          <MiniInfo
                            label="Mensajes"
                            value={String(item.condolences_count)}
                          />
                          <MiniInfo
                            label="Cierre"
                            value={formatDate(item.closes_at)}
                          />
                          <MiniInfo
                            label="Tema"
                            value={item.theme || "default"}
                          />
                        </div>

<div
  style={{
    marginBottom: isMobile ? 12 : 16,
    padding: isMobile ? "10px 12px" : "12px 14px",
    borderRadius: isMobile ? 12 : 16,
    background:
      item.status === "closed"
        ? "rgba(239,68,68,0.08)"
        : "rgba(59,130,246,0.08)",
    border:
      item.status === "closed"
        ? "1px solid rgba(239,68,68,0.18)"
        : "1px solid rgba(59,130,246,0.18)",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 700,
  }}
>
 ⏳ {getRemainingTimeLabel(item.closes_at, item.status)}
</div>

                      <div
  style={{
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: isMobile ? 12 : 16,
    padding: isMobile ? 10 : 12,
    marginBottom: isMobile ? 12 : 16,
  }}
>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#64748b",
                              marginBottom: 6,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Enlace público
                          </div>
                          <div
                            style={{
                              fontSize: isMobile ? 12 : 13,
                              color: "#0f172a",
                              lineHeight: 1.5,
                              wordBreak: "break-all",
                            }}
                          >
                            {getPublicUrl(item)}
                          </div>
                        </div>

                    <div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: isMobile ? 8 : 10,
  }}
>
  <button
    onClick={() => copyLink(item)}
    style={ghostButtonStyle}
  >
    Copiar enlace
  </button>

  <button
                            onClick={() => openQr(item)}
                            style={ghostButtonStyle}
                          >
                            QR
                          </button>

  <button
    onClick={() => openPage(item)}
    style={primarySmallButtonStyle}
  >
    Ver página
  </button>

                        
<button
  type="button"
  onClick={() => toggleModerationPanel(item.id)}
  style={ghostButtonStyle}
>
  {moderationPageId === item.id
  ? `Ocultar mensajes (${moderationTotalCount})`
  : `Moderar mensajes (${moderationTotalCount})`}
</button>

                          <button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleDeletePage(item.id, item.full_name);
  }}
  disabled={deletingPageId === item.id}
  style={{
    border: "1px solid rgba(239,68,68,0.22)",
    background: deletingPageId === item.id ? "#f3f4f6" : "rgba(254,242,242,0.9)",
    color: "#b91c1c",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 700,
    fontSize: 14,
    cursor: deletingPageId === item.id ? "not-allowed" : "pointer",
    opacity: deletingPageId === item.id ? 0.7 : 1,
  }}
>
  {deletingPageId === item.id ? "Eliminando..." : "Eliminar página"}
</button>

                         {item.status === "closed" ? (
  <button
    onClick={() => generatePdfNow(item.id, item.full_name)}
    style={ghostButtonStyle}
  >
    Ver PDF
  </button>
) : null}

                          {isOpen ? (
                            <button
                              onClick={() =>
                                closePage(item.id, item.full_name)
                              }
                              style={dangerButtonStyle}
                            >
                              Cerrar página
                            </button>



                          ) : (
                            <button
                              onClick={() =>
                                reopenPage(item.id, item.full_name)
                              }
                              style={ghostButtonStyle}
                            >
                              Reabrir página
                            </button>
                          )}
                        </div>

{moderationPageId === item.id && (
  <div
    style={{
      marginTop: 14,
      padding: 14,
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
    }}
  >
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 18,
    paddingBottom: 8,
    borderBottom: "2px solid #e2e8f0",
    letterSpacing: "-0.01em",
  }}
>
  <span>Moderación de mensajes</span>

  <span
    style={{
      background: "#e2e8f0",
      color: "#0f172a",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      lineHeight: 1,
    }}
  >
    {moderationTotalCount} total
  </span>
</div>

<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    fontWeight: 800,
    color: "#92400e",
  }}
>
  <span>Pendientes de revisión</span>

  <span
    style={{
      background: "#fef3c7",
      color: "#92400e",
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
    }}
  >
    {pendingMessagesByPage[item.id]?.length || 0}
  </span>
</div>



{loadingPendingForPage === item.id ? (
  <div style={{ color: "#666", marginBottom: 14 }}>Cargando pendientes...</div>
) : !pendingMessagesByPage[item.id] || pendingMessagesByPage[item.id].length === 0 ? (
  <div style={{ color: "#666", marginBottom: 14 }}>
    No hay mensajes pendientes en esta página.
  </div>
) : (
  <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
    {pendingMessagesByPage[item.id].map((msg) => (
      <div
        key={msg.id}
        style={{
          background: "#fffaf0",
          border: "1px solid rgba(234,179,8,0.22)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 700 }}>
          {msg.author_name || "Anónimo"}
        </div>

        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
          {new Date(msg.created_at).toLocaleString()}
        </div>

        <div style={{ marginTop: 8, lineHeight: 1.5 }}>
          {msg.message}
        </div>

        {msg.photo_path && (
  <img
    src={
  supabase.storage
    .from("condolence-photos")
    .getPublicUrl(msg.photo_path).data.publicUrl
}
    alt="Foto adjunta al mensaje"
    style={{
      marginTop: 10,
      width: 120,
      height: 120,
      objectFit: "cover",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      display: "block",
    }}
  />
)}

        {msg.moderation_reason ? (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#92400e",
              fontWeight: 600,
            }}
          >
            Motivo IA: {msg.moderation_reason}
          </div>
        ) : null}

      

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <button
            type="button"
            onClick={() => handleApproveMessage(msg.id, item.id)}
            disabled={deletingMessageId === msg.id}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(16,185,129,0.18)",
              background: deletingMessageId === msg.id ? "#f3f4f6" : "white",
              color: "#047857",
              fontWeight: 700,
              cursor: deletingMessageId === msg.id ? "not-allowed" : "pointer",
              opacity: deletingMessageId === msg.id ? 0.7 : 1,
            }}
          >
            Aprobar
          </button>

          <button
            type="button"
            onClick={() => handleDeleteMessage(msg.id, item.id)}
            disabled={deletingMessageId === msg.id}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(220,38,38,0.18)",
              background: deletingMessageId === msg.id ? "#f3f4f6" : "white",
              color: "#b91c1c",
              fontWeight: 700,
              cursor: deletingMessageId === msg.id ? "not-allowed" : "pointer",
              opacity: deletingMessageId === msg.id ? 0.7 : 1,
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    ))}
  </div>
)}

<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    fontWeight: 800,
    color: "#0f172a",
    marginTop: 20,
  }}
>
  <span>Mensajes publicados</span>

  <span
    style={{
      background: "#e2e8f0",
      color: "#0f172a",
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
    }}
  >
    {pageMessages[item.id]?.length || 0}
  </span>
</div>

    {loadingMessagesForPage === item.id ? (
      <div style={{ color: "#666" }}>Cargando mensajes...</div>
    ) : !pageMessages[item.id] || pageMessages[item.id].length === 0 ? (
      <div style={{ color: "#666" }}>No hay mensajes visibles en esta página.</div>
    ) : (
      <div style={{ display: "grid", gap: 10 }}>
        {pageMessages[item.id].map((msg) => (
          <div
            key={msg.id}
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {msg.author_name || "Anónimo"}
            </div>

            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              {new Date(msg.created_at).toLocaleString()}
            </div>

            <div style={{ marginTop: 8, lineHeight: 1.5 }}>
              {msg.message}
            </div>

            {msg.photo_path && (
  <img
   src={
  supabase.storage
    .from("condolence-photos")
    .getPublicUrl(msg.photo_path).data.publicUrl
}
    alt="Foto adjunta al mensaje"
    style={{
      marginTop: 10,
      width: 120,
      height: 120,
      objectFit: "cover",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      display: "block",
    }}
  />
)}

            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => handleDeleteMessage(msg.id, item.id)}
                disabled={deletingMessageId === msg.id}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(220,38,38,0.18)",
                  background: deletingMessageId === msg.id ? "#f3f4f6" : "white",
                  color: "#b91c1c",
                  fontWeight: 700,
                  cursor: deletingMessageId === msg.id ? "not-allowed" : "pointer",
                  opacity: deletingMessageId === msg.id ? 0.7 : 1,
                }}
              >
                {deletingMessageId === msg.id ? "Eliminando..." : "Eliminar mensaje"}
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    fontWeight: 800,
    color: "#991b1b",
    marginTop: 24,
  }}
>
  <span>Mensajes bloqueados por IA</span>

  <span
    style={{
      background: "#fee2e2",
      color: "#991b1b",
      padding: "3px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
    }}
  >
    {rejectedMessagesByPage[item.id]?.length || 0}
  </span>
</div>

{!rejectedMessagesByPage[item.id] || rejectedMessagesByPage[item.id].length === 0 ? (
  <div style={{ color: "#666" }}>No hay mensajes bloqueados.</div>
) : (
  <div style={{ display: "grid", gap: 10 }}>
    {rejectedMessagesByPage[item.id].map((msg) => (
      <div
        key={msg.id}
        style={{
          background: "#fef2f2",
          border: "1px solid rgba(220,38,38,0.25)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 700 }}>
          {msg.author_name || "Anónimo"}
        </div>

        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
          {new Date(msg.created_at).toLocaleString()}
        </div>

        <div style={{ marginTop: 8, lineHeight: 1.5 }}>
          {msg.message}
        </div>

        {msg.photo_path && (
  <img
    src={
  supabase.storage
    .from("condolence-photos")
    .getPublicUrl(msg.photo_path).data.publicUrl
}
    alt="Foto adjunta al mensaje"
    style={{
      marginTop: 10,
      width: 120,
      height: 120,
      objectFit: "cover",
      borderRadius: 12,
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      display: "block",
    }}
  />
)}

        {msg.moderation_reason && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#991b1b",
              fontWeight: 600,
            }}
          >
            Motivo IA: {msg.moderation_reason}
          </div>
        )}

<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
  <button
    type="button"
    onClick={() => handleApproveMessage(msg.id, item.id)}
    disabled={deletingMessageId === msg.id}
    style={{
      padding: "8px 12px",
      borderRadius: 10,
      border: "1px solid rgba(16,185,129,0.18)",
      background: deletingMessageId === msg.id ? "#f3f4f6" : "white",
      color: "#047857",
      fontWeight: 700,
      cursor: deletingMessageId === msg.id ? "not-allowed" : "pointer",
      opacity: deletingMessageId === msg.id ? 0.7 : 1,
    }}
  >
    Aprobar igualmente
  </button>

  <button
    type="button"
    onClick={() => handleDeleteMessage(msg.id, item.id)}
    disabled={deletingMessageId === msg.id}
    style={{
      padding: "8px 12px",
      borderRadius: 10,
      border: "1px solid rgba(220,38,38,0.18)",
      background: deletingMessageId === msg.id ? "#f3f4f6" : "white",
      color: "#b91c1c",
      fontWeight: 700,
      cursor: deletingMessageId === msg.id ? "not-allowed" : "pointer",
      opacity: deletingMessageId === msg.id ? 0.7 : 1,
    }}
  >
    Eliminar
  </button>
</div>

      </div>
    ))}
  </div>
)}
  </div>
)}




                      </div>
                       </div>
  </>
  );
})}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



const planButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.12)",
  background: "white",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(value: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function getRemainingTimeLabel(
  closesAt: string | null,
  status: string | null
) {
  if (status === "closed") {
    return "Página cerrada";
  }

  if (!closesAt) return "Sin fecha de cierre";

  const now = new Date();
  const closeDate = new Date(closesAt);
  const diffMs = closeDate.getTime() - now.getTime();

  if (Number.isNaN(closeDate.getTime())) return "Sin fecha de cierre";

  if (diffMs <= 0) {
    return "Página vencida";
  }

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return "Cierra hoy";
  if (diffDays === 2) return "Cierra en 1 día";

  return `Cierra en ${diffDays - 1} días`;
}

function StatCard({
  title,
  value,
  subtitle,
  isMobile,
}: {
  title: string;
  value: string;
  subtitle: string;
  isMobile?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.84)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.72)",
        borderRadius: isMobile ? 16 : 22,
        padding: isMobile ? "10px 12px" : 18,
        boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          fontSize: isMobile ? 11 : 13,
          fontWeight: 700,
          color: "#64748b",
          marginBottom: isMobile ? 4 : 8,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: isMobile ? 22 : 32,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          marginBottom: isMobile ? 4 : 8,
        }}
      >
        {value}
      </div>

      <div style={{ fontSize: isMobile ? 12 : 14, color: "#475569" }}>
        {subtitle}
      </div>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#64748b",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 14,
        fontWeight: 700,
        color: "#0f172a",
        marginBottom: 8,
        marginTop: 14,
      }}
    >
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  border: "1px solid #dbe3ee",
  background: "rgba(255,255,255,0.95)",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  color: "#0f172a",
};

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.84)",
  border: "1px solid rgba(255,255,255,0.72)",
  borderRadius: 24,
  padding: 20,
  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
};

const filterStyle: React.CSSProperties = {
  border: "1px solid #dbe3ee",
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  borderRadius: 14,
  padding: "12px 16px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const activeFilterStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  borderRadius: 14,
  padding: "12px 16px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const primarySmallButtonStyle: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
  color: "white",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const ghostButtonStyle: React.CSSProperties = {
  border: "1px solid #dbe3ee",
  background: "rgba(255,255,255,0.9)",
  color: "#0f172a",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(254,242,242,0.9)",
  color: "#b91c1c",
  borderRadius: 14,
  padding: "12px 14px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};