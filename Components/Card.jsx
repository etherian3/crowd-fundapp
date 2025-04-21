import React, { useEffect, useState } from "react";

const Card = ({
  title,
  allcampaign,
  setOpenModel,
  setDonateCampaign,
  isLoading,
  isFinished = false,
}) => {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    if (allcampaign) {
      setCampaigns(allcampaign);
    }
  }, [allcampaign]);

  const daysLeft = (deadline) => {
    try {
      // Convert deadline dari timestamp dalam detik ke milliseconds
      const deadlineTimestamp = Number(deadline);
      const deadlineMs = deadlineTimestamp * 1000;
      const currentTime = Date.now();

      // Hitung selisih dalam hari
      const diffTime = deadlineMs - currentTime;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Pastikan nilai tidak negatif
      return Math.max(0, diffDays);
    } catch (error) {
      console.error("Error calculating days left:", error, deadline);
      return 0;
    }
  };

  const isTargetReached = (amountCollected, target) => {
    return parseFloat(amountCollected) >= parseFloat(target);
  };

  if (isLoading) {
    return (
      <div className="py-12 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-300 mt-4">Memuat Campaign...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="campaigns" className="py-12 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
            {title}
          </h2>
          <div className="w-20 h-1 bg-purple-600 mx-auto rounded-full"></div>
        </div>

        {!campaigns || campaigns.length === 0 ? (
          <div className="text-center py-12 px-4 bg-gray-800 rounded-xl shadow-sm border border-gray-700">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isFinished
                ? "Belum ada campaign yang berakhir/tercapai"
                : "Belum ada campaign yang aktif"}
            </h3>
            <p className="text-gray-400">
              {isFinished
                ? "Campaign akan muncul di sini setelah berakhir atau mencapai target"
                : "Jadilah yang pertama membuat campaign!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
            {campaigns.map((campaign, i) => {
              const daysRemaining = daysLeft(campaign.deadline);
              const progressPercentage =
                parseFloat(campaign.target) > 0
                  ? (parseFloat(campaign.amountCollected) /
                      parseFloat(campaign.target)) *
                    100
                  : 0;
              const targetReached = isTargetReached(
                campaign.amountCollected,
                campaign.target
              );

              return (
                <div
                  key={i + 1}
                  className="bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-700"
                >
                  <div className="bg-purple-700 text-white py-4 px-6">
                    <h3 className="text-xl font-bold mb-1 line-clamp-1">
                      {campaign.title}
                    </h3>
                    <p className="text-sm text-purple-100 opacity-80">
                      {campaign.owner.slice(0, 6)}...{campaign.owner.slice(-4)}
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          targetReached
                            ? "bg-green-900 text-green-300"
                            : daysRemaining <= 0
                            ? "bg-red-900 text-red-300"
                            : daysRemaining <= 3
                            ? "bg-yellow-800 text-yellow-300"
                            : "bg-purple-900 text-purple-300"
                        }`}
                      >
                        {targetReached
                          ? "Target Tercapai!"
                          : daysRemaining <= 0
                          ? "Campaign Berakhir"
                          : `${daysRemaining} Hari Tersisa`}
                      </span>
                    </div>

                    <p className="text-gray-300 mb-6 line-clamp-3 h-18">
                      {campaign.description}
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-400">
                          Progress
                        </span>
                        <span className="font-bold text-purple-400">
                          {progressPercentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                            targetReached ? "bg-green-500" : "bg-purple-500"
                          }`}
                          style={{
                            width: `${Math.min(progressPercentage, 100)}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <div>
                          <span className="text-2xl font-bold text-white">
                            {campaign.amountCollected}
                          </span>
                          <span className="text-sm text-gray-400 ml-1">
                            ETH
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-white">
                            {campaign.target}
                          </span>
                          <span className="text-sm text-gray-400 ml-1">
                            ETH
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setDonateCampaign(campaign);
                          setOpenModel(true);
                        }}
                        disabled={daysRemaining <= 0 || targetReached}
                        className={`w-full px-4 py-3 text-sm font-medium cursor-pointer text-white transition-colors duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          daysRemaining <= 0 || targetReached
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700"
                        }`}
                      >
                        {targetReached ? (
                          "Target Tercapai!"
                        ) : daysRemaining <= 0 ? (
                          "Campaign Berakhir"
                        ) : (
                          <span className="flex items-center justify-center">
                            Donasi Sekarang
                            <svg
                              className="w-4 h-4 ml-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                              />
                            </svg>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
