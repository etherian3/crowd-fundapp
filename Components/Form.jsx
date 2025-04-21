import React, { useState, useContext } from "react";
import { CrowdFundContext } from "../Context/CrowdFund";
import { toast } from "react-hot-toast";

const Form = () => {
  const { createCampaign, isLoading } = useContext(CrowdFundContext);
  const [form, setForm] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
  });

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi form
    if (!form.title || !form.description || !form.target || !form.deadline) {
      toast.error("Semua kolom harus diisi!");
      return;
    }

    if (parseFloat(form.target) <= 0) {
      toast.error("Target donasi harus lebih dari 0 ETH");
      return;
    }

    // Deadline harus lebih dari hari ini
    const deadlineDate = new Date(form.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deadlineDate <= today) {
      toast.error("Deadline harus setelah hari ini");
      return;
    }

    try {
      await createCampaign(form);
      toast.success("Campaign berhasil dibuat!");
      setForm({
        title: "",
        description: "",
        target: "",
        deadline: "",
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Gagal membuat campaign. Silakan coba lagi.");
    }
  };

  return (
    <div className="bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg shadow-md p-8 border border-gray-700">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Buat Campaign Baru
            </h2>
            <p className="text-gray-300">
              Mulai sebuah campaign untuk mendanai ide atau proyek Anda
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Judul Campaign <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="title"
                placeholder="Judul Campaign Anda"
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={form.title}
                onChange={(e) => handleFormFieldChange("title", e)}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Deskripsi <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                rows="4"
                placeholder="Ceritakan tentang campaign Anda"
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={form.description}
                onChange={(e) => handleFormFieldChange("description", e)}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="target"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Target (ETH) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                id="target"
                placeholder="0.5"
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={form.target}
                onChange={(e) => handleFormFieldChange("target", e)}
              />
            </div>

            <div className="mb-8">
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Deadline <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="deadline"
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={form.deadline}
                onChange={(e) => handleFormFieldChange("deadline", e)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-6 py-4 text-white font-medium rounded-md shadow transition-colors ${
                isLoading
                  ? "bg-purple-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </div>
              ) : (
                "Buat Campaign"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Form; 