import React, { useState, useContext, useEffect } from "react";

//INTERNAL IMPORT
import { CrowdFundContext } from "../Context/CrowdFund";
import { Hero, Card, PopUp } from "../Components/index";
import Head from "next/head";

const index = () => {
  const {
    titleData,
    currentAccount,
    allCampaigns,
    isLoading,
    createCampaign,
  } = useContext(CrowdFundContext);

  const [openModal, setOpenModal] = useState(false);
  const [donateCampaign, setDonateCampaign] = useState();
  const [finishedCampaigns, setFinishedCampaigns] = useState([]);
  const [activeCampaigns, setActiveCampaigns] = useState([]);

  useEffect(() => {
    if (allCampaigns && allCampaigns.length > 0) {
      // Filter untuk campaign yang masih aktif
      const active = allCampaigns.filter(campaign => {
        const deadline = Number(campaign.deadline);
        const now = Math.floor(Date.now() / 1000); // Konversi ke detik
        const targetReached = parseFloat(campaign.amountCollected) >= parseFloat(campaign.target);
        
        return deadline > now && !targetReached;
      });
      
      // Filter untuk campaign yang sudah berakhir atau target tercapai
      const finished = allCampaigns.filter(campaign => {
        const deadline = Number(campaign.deadline);
        const now = Math.floor(Date.now() / 1000); // Konversi ke detik
        const targetReached = parseFloat(campaign.amountCollected) >= parseFloat(campaign.target);
        
        return deadline <= now || targetReached;
      });
      
      setActiveCampaigns(active);
      setFinishedCampaigns(finished);
    } else {
      setActiveCampaigns([]);
      setFinishedCampaigns([]);
    }
  }, [allCampaigns]);

  return (
    <div>
      <Head>
        <title>Crowd Funding App | Donasi untuk Proyek</title>
        <meta name="description" content="Platform crowdfunding untuk membantu pendanaan proyek" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div> {/* Tidak perlu padding-top karena Navbar dirender di _app.js */}
        <Hero titleData={titleData} createCampaign={createCampaign} />
        
        <Card 
          title="Semua Campaign Aktif"
          allcampaign={activeCampaigns}
          setOpenModel={setOpenModal}
          setDonateCampaign={setDonateCampaign}
          isLoading={isLoading}
        />

        {finishedCampaigns.length > 0 && (
          <Card
            title="Campaign Berakhir & Tercapai"
            allcampaign={finishedCampaigns}
            setOpenModel={setOpenModal}
            setDonateCampaign={setDonateCampaign}
            isLoading={isLoading}
            isFinished={true}
          />
        )}
      </div>

      {openModal && (
        <PopUp
          setOpenModel={setOpenModal}
          donateCampaign={donateCampaign}
        />
      )}
    </div>
  );
};

export default index;
