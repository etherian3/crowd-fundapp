import React, { useState, useContext, useEffect } from "react";
import { CrowdFundContext } from "../Context/CrowdFund";
import Head from "next/head";
import { toast, Toaster } from "react-hot-toast";

// Components
import { Hero, Card, PopUp } from "../Components";

export default function Home() {
  const {
    titleData,
    createCampaign,
    getCampaigns,
    allCampaigns,
    userCampaigns,
    isLoading,
    currentAccount,
    donateToCampaign,
    loadCampaigns,
  } = useContext(CrowdFundContext);

  const [openModal, setOpenModal] = useState(false);
  const [donateCampaign, setDonateCampaign] = useState(null);
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [finishedCampaigns, setFinishedCampaigns] = useState([]);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Toast notification setup
  useEffect(() => {
    // Hanya tampilkan toast jika user belum pernah connect wallet sebelumnya
    if (!currentAccount && !localStorage.getItem('walletConnected')) {
      toast.dismiss();
      toast("Harap sambungkan dompet untuk melihat campaign lengkap", {
        icon: '⚠️',
        duration: 5000,
        position: 'top-center',
      });
    } else if (currentAccount) {
      // Jika sudah connect, simpan status di localStorage
      localStorage.setItem('walletConnected', 'true');
    }
  }, [currentAccount]);

  // Fungsi wrapper untuk createCampaign dengan refresh otomatis
  const handleCreateCampaign = async (campaignData) => {
    try {
      const result = await createCampaign(campaignData);
      if (result) {
        // Refresh kampanye setelah berhasil membuat kampanye baru
        await loadCampaigns();
        // Trigger refresh UI
        setRefreshTrigger(prev => prev + 1);
        return result;
      }
      return null;
    } catch (error) {
      console.error("Error saat membuat kampanye:", error);
      setError("Gagal membuat kampanye. Silakan coba lagi.");
      return null;
    }
  };

  // Filter campaigns
  useEffect(() => {
    try {
      if (allCampaigns && allCampaigns.length > 0) {
        console.log(`Memproses ${allCampaigns.length} campaigns`);
        
        // Reset error
        setError(null);
        
        // Filter kampanye berdasarkan batas waktu dan target
        const currentTime = Date.now();
        const active = [];
        const finished = [];
        
        allCampaigns.forEach(campaign => {
          try {
            if (!campaign || typeof campaign !== 'object') {
              console.warn("Campaign tidak valid:", campaign);
              return;
            }
            
            // Validasi deadline
            const deadline = Number(campaign.deadline);
            if (isNaN(deadline)) {
              console.warn("Deadline tidak valid:", campaign.deadline);
              return;
            }
            
            // Konversi deadline ke ms
            const deadlineDate = deadline * 1000;
            
            // Konversi target dan amount ke angka
            const target = parseFloat(campaign.target);
            const amountCollected = parseFloat(campaign.amountCollected);
            
            if (isNaN(target) || isNaN(amountCollected)) {
              console.warn("Target atau amount tidak valid:", campaign);
              return;
            }
            
            // Cek apakah campaign sudah berakhir atau target terpenuhi
            const isDeadlinePassed = deadlineDate < currentTime;
            const isTargetReached = amountCollected >= target;
            
            if (isDeadlinePassed || isTargetReached) {
              finished.push(campaign);
            } else {
              active.push(campaign);
            }
          } catch (err) {
            console.error(`Error saat memproses campaign:`, err, campaign);
          }
        });
        
        console.log(`Hasil filter: ${active.length} aktif, ${finished.length} selesai`);
        setActiveCampaigns(active);
        setFinishedCampaigns(finished);
      } else {
        setActiveCampaigns([]);
        setFinishedCampaigns([]);
      }
    } catch (err) {
      console.error("Error saat memfilter campaign:", err);
      setError("Terjadi kesalahan saat memproses data kampanye");
      setActiveCampaigns([]);
      setFinishedCampaigns([]);
    }
  }, [allCampaigns, refreshTrigger]);

  // Fungsi untuk me-refresh data secara manual
  const refreshData = async () => {
    try {
      setError(null);
      toast.loading("Memuat ulang data kampanye...", { id: "refresh-data" });
      await loadCampaigns();
      toast.success("Data berhasil dimuat ulang", { id: "refresh-data" });
    } catch (err) {
      console.error("Error saat refresh data:", err);
      setError("Gagal memuat ulang data");
      toast.error("Gagal memuat ulang data", { id: "refresh-data" });
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <Head>
        <title>CrowdFund App | Donasi dengan Mudah</title>
        <meta name="description" content="Aplikasi crowdfunding berbasis blockchain" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Toast Container */}
      <Toaster />

      {/* Hero Section */}
      <Hero titleData={titleData} createCampaign={handleCreateCampaign} />

      {/* Error Message */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-8">
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
            <button 
              onClick={refreshData}
              className="mt-2 px-3 py-1 bg-red-800 text-white text-sm rounded hover:bg-red-700"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      )}

      {/* Active Campaigns */}
      <Card
        title="Kampanye Aktif"
        allcampaign={activeCampaigns}
        setOpenModel={setOpenModal}
        setDonateCampaign={setDonateCampaign}
        isLoading={isLoading}
      />

      {/* Finished Campaigns */}
      <Card
        title="Kampanye Selesai"
        allcampaign={finishedCampaigns}
        setOpenModel={setOpenModal}
        setDonateCampaign={setDonateCampaign}
        isLoading={isLoading}
        isFinished={true}
      />

      {/* Donation Modal */}
      {openModal && (
        <PopUp
          setOpenModel={setOpenModal}
          donateCampaign={donateCampaign}
        />
      )}
    </div>
  );
}
