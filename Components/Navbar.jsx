import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { CrowdFundContext } from "../Context/CrowdFund";
import { Logo, Menu } from "./index";

const Navbar = () => {
  const { currentAccount, connectWallet } = useContext(CrowdFundContext);
  const [balance, setBalance] = useState("0");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuList = ["White Paper", "Project", "Donations", "Members"];

  useEffect(() => {
    const getBalance = async () => {
      if (currentAccount && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balance = await provider.getBalance(currentAccount);
          setBalance(parseFloat(ethers.formatEther(balance)).toFixed(4));
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance("0");
        }
      }
    };

    getBalance();
  }, [currentAccount]);

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-gray-800 sticky top-0 z-50 shadow-md">
      <div className="px-4 py-3 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8">
        <div className="relative flex items-center justify-between">
          <div className="flex items-center">
            <a
              href="/"
              aria-label="Company"
              title="Company"
              className="inline-flex items-center mr-8"
            >
              <Logo color="white" />
              <span className="ml-2 text-lg font-bold tracking-wide text-white uppercase">
                CROWDFUND
              </span>
            </a>
            <ul className="flex items-center hidden space-x-8 lg:flex">
              {menuList.map((el, i) => (
                <li key={i + 1}>
                  <a
                    href="/"
                    aria-label="Our product"
                    title="Our product"
                    className="font-medium tracking-wide text-gray-200 transition-colors duration-200 hover:text-purple-400 text-sm"
                  >
                    {el}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {currentAccount ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-1.5 transition"
              >
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-white">
                    {formatAddress(currentAccount)}
                  </span>
                  <span className="text-xs text-gray-300">
                    {balance} ETH
                  </span>
                </div>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4 z-50">
                  <div className="mb-2">
                    <span className="text-xs text-gray-400">Alamat Wallet:</span>
                    <div className="mt-1 text-sm text-gray-300 break-all">
                      {currentAccount}
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs text-gray-400">Saldo:</span>
                    <div className="mt-1 text-lg font-bold text-white">
                      {balance} ETH
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ul className="flex items-center hidden space-x-8 lg:flex">
              <li>
                <button
                  onClick={() => connectWallet()}
                  className="inline-flex items-center justify-center h-9 px-4 text-sm font-medium tracking-wide text-white transition duration-200 rounded shadow-md bg-purple-600 hover:bg-purple-700 focus:outline-none"
                  aria-label="Sign up"
                  title="Sign up"
                >
                  Hubungkan Wallet
                </button>
              </li>
            </ul>
          )}

          <div className="lg:hidden z-40">
            <button
              aria-label="Open Menu"
              title="Open Menu"
              className="p-2 -mr-1 transition duration-200 rounded focus:outline-none focus:shadow-outline hover:bg-gray-700"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu />
            </button>

            {isMenuOpen && (
              <div className="absolute top-0 left-0 w-full">
                <div className="p-5 bg-gray-800 border rounded shadow-sm border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <a
                        href="/"
                        aria-label="Company"
                        title="Company"
                        className="inline-flex items-center"
                      >
                        <Logo color="white" />
                        <span className="ml-2 text-lg font-bold tracking-wide text-white uppercase">
                          CROWDFUND
                        </span>
                      </a>
                    </div>
                    <div>
                      <button
                        aria-label="Close Menu"
                        title="Close Menu"
                        className="p-2 -mt-2 -mr-2 transition duration-200 rounded hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg className="w-5 text-white" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M19.7,4.3c-0.4-0.4-1-0.4-1.4,0L12,10.6L5.7,4.3c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l6.3,6.3l-6.3,6.3 c-0.4,0.4-0.4,1,0,1.4C4.5,19.9,4.7,20,5,20s0.5-0.1,0.7-0.3l6.3-6.3l6.3,6.3c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3 c0.4-0.4,0.4-1,0-1.4L13.4,12l6.3-6.3C20.1,5.3,20.1,4.7,19.7,4.3z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <nav>
                    <ul className="space-y-4">
                      {menuList.map((el, i) => (
                        <li key={i + 1}>
                          <a
                            href="/"
                            aria-label="Our product"
                            title="Our product"
                            className="font-medium tracking-wide text-gray-200 transition-colors duration-200 hover:text-purple-400"
                          >
                            {el}
                          </a>
                        </li>
                      ))}
                      <li>
                        {currentAccount ? (
                          <div className="flex items-center space-x-2 bg-gray-700 p-2 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {formatAddress(currentAccount)}
                              </p>
                              <p className="text-xs text-gray-300">
                                {balance} ETH
                              </p>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => connectWallet()}
                            className="inline-flex items-center justify-center w-full h-9 px-4 text-sm font-medium tracking-wide text-white transition duration-200 rounded shadow-md bg-purple-600 hover:bg-purple-700 focus:outline-none"
                            aria-label="Sign up"
                            title="Sign up"
                          >
                            Hubungkan Wallet
                          </button>
                        )}
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
