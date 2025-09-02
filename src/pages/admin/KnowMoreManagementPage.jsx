import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { knowMoreAPI } from "../../services/api";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  FileText,
  Users,
  BarChart3,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Settings,
  Star,
  HelpCircle,
  Phone,
  Image,
   Type,
   Layout,
   ChevronUp
  
  
} from "lucide-react";
import "./KnowMoreManagementPage.css";
import "../../components/admin/ContentBuilder.css"; // Add this line
// CORRECT - Use react-beautiful-dnd for these components
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const getSubcategoryOptions = (category) => {
  const subcategories = {
    // 1. Aggregate categories
    aggregate: [
      { value: "dust", label: "Dust" },
      { value: "10mm_metal", label: "10 MM Metal" },
      { value: "20mm_metal", label: "20 MM Metal" },
      { value: "40mm_metal", label: "40 MM Metal" },
      { value: "gsb", label: "GSB" },
      { value: "wmm", label: "WMM" },
      { value: "m_sand", label: "M.Sand" },
    ],

    // 2. Sand categories
    sand: [
      { value: "river_sand_plastering", label: "River Sand (Plastering)" },
      { value: "river_sand", label: "River Sand" },
    ],

    // 3. TMT Steel categories
    tmt_steel: [
      { value: "fe_415", label: "FE-415" },
      { value: "fe_500", label: "FE-500" },
      { value: "fe_550", label: "FE-550" },
      { value: "fe_600", label: "FE-600" },
    ],

    // 4. Bricks & Blocks categories
    bricks_blocks: [
      { value: "red_bricks", label: "Red Bricks" },
      { value: "fly_ash_bricks", label: "Fly Ash Bricks" },
      { value: "concrete_blocks", label: "Concrete Blocks" },
      { value: "aac_blocks", label: "AAC Blocks" },
      { value: "solid_blocks", label: "Solid Blocks" },
    ],

    // 5. Cement categories
    cement: [
      { value: "opc_33_grade", label: "OPC 33 Grade" },
      { value: "opc_43_grade", label: "OPC 43 Grade" },
      { value: "opc_53_grade", label: "OPC 53 Grade" },
      { value: "ppc_cement", label: "PPC Cement" },
    ],
  };

  return subcategories[category] || [];
};

// Helper function for dynamic specification placeholders
const getSpecificationPlaceholder = (category, subcategory, field) => {
  const placeholders = {
    cement: {
      name: ["Brand", "Grade", "Bag Weight", "Compressive Strength"],
      value: ["UltraTech", "53 Grade", "50 KG", "53 MPa"],
    },
    aggregate: {
      name: ["Size", "Grade", "Source", "Crushing Value"],
      value: ["10mm", "Premium", "Quarry Stone", "< 30%"],
    },
    sand: {
      name: ["Type", "Fineness Modulus", "Source", "Silt Content"],
      value: ["Natural River Sand", "2.6", "Krishna River", "< 3%"],
    },
    tmt_steel: {
      name: ["Brand", "Grade", "Diameter", "Yield Strength"],
      value: ["TATA Steel", "Fe 500", "12mm", "500 N/mm²"],
    },
    bricks_blocks: {
      name: ["Type", "Size", "Compressive Strength", "Water Absorption"],
      value: ["Fly Ash Brick", "230x110x75mm", "7.5 MPa", "< 20%"],
    },
  };

  const categoryPlaceholders = placeholders[category];
  if (categoryPlaceholders && categoryPlaceholders[field]) {
    const options = categoryPlaceholders[field];
    return options[Math.floor(Math.random() * options.length)];
  }

  return field === "name" ? "Specification name" : "Specification value";
};

const KnowMoreManagementPage = () => {
  const [activeTab, setActiveTab] = useState("contents");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [showPreview, setShowPreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Debug logging
  useEffect(() => {
    console.log("🔍 KnowMoreManagementPage initialized with filters:", {
      searchTerm,
      statusFilter,
      categoryFilter,
      currentPage,
      activeTab,
    });
  }, [searchTerm, statusFilter, categoryFilter, currentPage, activeTab]);

  // Fetch all know more contents (for subcategories)
  const {
    data: contentsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["knowMoreContents", currentPage, searchTerm, statusFilter, categoryFilter],
    async () => {
      console.log("🔍 Fetching know more contents for subcategories...");

      try {
        // Build query parameters (remove empty values)
        const params = {};
        if (currentPage > 1) params.page = currentPage;
        if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
        if (statusFilter && statusFilter !== "all")
          params.status = statusFilter;
        if (categoryFilter && categoryFilter !== "all")
          params.category = categoryFilter;
        params.limit = 10;

        console.log("📤 Request params:", params);

        const response = await knowMoreAPI.getAllContents(params);
        console.log("📥 Response:", response);

        return response;
      } catch (error) {
        console.error("❌ API Error:", error);
        console.error("❌ Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        throw error;
      }
    },
    {
      keepPreviousData: true,
      staleTime: 30000,
      retry: (failureCount, error) => {
        console.log(
          `🔄 Retry attempt ${failureCount} for error:`,
          error.response?.status
        );
        // Don't retry auth errors
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          return false;
        }
        return failureCount < 2;
      },
      onError: (error) => {
        console.error("🚨 Query failed:", error);
        let errorMessage = "Failed to load know more contents";

        if (error?.response?.status === 401) {
          errorMessage = "Authentication required. Please login again.";
        } else if (error?.response?.status === 403) {
          errorMessage = "Access denied. Admin permissions required.";
        } else if (error?.response?.status === 404) {
          errorMessage =
            "Know more API endpoints not found. Please check backend routes.";
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
      },
    }
  );

  // Fetch analytics data
  const {
    data: analyticsData,
    error: analyticsError,
    isLoading: analyticsLoading,
  } = useQuery(
    "knowMoreAnalytics",
    async () => {
      console.log("📊 Fetching know more analytics...");
      try {
        const response = await knowMoreAPI.getAnalytics();
        console.log("📈 Analytics response:", response);
        return response;
      } catch (error) {
        console.error("❌ Analytics error:", error);
        // Don't fail the whole page if analytics fails
        return { data: {} };
      }
    },
    {
      retry: 1,
      staleTime: 60000, // Cache for 1 minute
    }
  );

  // Toggle status mutation
  const toggleStatusMutation = useMutation(
    async (id) => {
      console.log("🔄 Toggling status for content:", id);
      const response = await knowMoreAPI.toggleStatus(id);
      return response;
    },
    {
      onSuccess: (data, variables) => {
        console.log("✅ Status toggled successfully for:", variables);
        toast.success("Status updated successfully");
        queryClient.invalidateQueries("knowMoreContents");
      },
      onError: (error) => {
        console.error("❌ Toggle status failed:", error);
        toast.error(
          error?.response?.data?.message || "Failed to update status"
        );
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    async (id) => {
      console.log("🗑️ Deleting content:", id);
      const response = await knowMoreAPI.deleteContent(id);
      return response;
    },
    {
      onSuccess: (data, variables) => {
        console.log("✅ Content deleted successfully:", variables);
        toast.success("Content deleted successfully");
        queryClient.invalidateQueries("knowMoreContents");
      },
      onError: (error) => {
        console.error("❌ Delete failed:", error);
        toast.error(
          error?.response?.data?.message || "Failed to delete content"
        );
      },
    }
  );

  // Event handlers
  const handleEdit = (content) => {
    console.log("✏️ Editing content:", content);
    setEditingContent(content);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id) => {
    toggleStatusMutation.mutate(id);
  };

  const handleCreate = () => {
    console.log("➕ Creating new content");
    setEditingContent(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContent(null);
  };

  const handlePreview = (content) => {
    setShowPreview(content);
  };

  const closePreview = () => {
    setShowPreview(null);
  };

  // Extract data from response
  const contents = contentsResponse?.data?.contents || [];
  const pagination = contentsResponse?.data?.pagination || {};

  return (
    <div className="know-more-management">
      <div className="page-header">
        <div className="header-content">
          <h1>Know More Management</h1>
          <p>Manage product and subcategory information content</p>
        </div>

        <div className="header-actions">
          <button className="btn-refresh" onClick={() => refetch()}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className="btn-primary" onClick={handleCreate}>
            <Plus size={18} />
            Create Content
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="page-tabs">
        <button
          className={`tab ${activeTab === "contents" ? "active" : ""}`}
          onClick={() => setActiveTab("contents")}
        >
          <FileText size={16} />
          Contents ({contents.length})
        </button>
        <button
          className={`tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search contents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="aggregate">Aggregate</option>
            <option value="sand">Sand</option>
            <option value="tmt_steel">TMT Steel</option>
            <option value="bricks_blocks">Bricks & Blocks</option>
            <option value="cement">Cement</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeTab === "contents" && (
          <div className="contents-tab">
            {isLoading ? (
              <div className="loading-state">
                <RefreshCw className="spinning" size={24} />
                <p>Loading contents...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <AlertCircle size={24} />
                <p>Failed to load contents</p>
                <button onClick={() => refetch()} className="btn-secondary">
                  Try Again
                </button>
              </div>
            ) : contents.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <h3>No Contents Found</h3>
                <p>Create your first know more content to get started.</p>
                <button onClick={handleCreate} className="btn-primary">
                  <Plus size={18} />
                  Create Content
                </button>
              </div>
            ) : (
              <>
                <div className="contents-grid">
                  {contents.map((content) => (
                    <div key={content._id} className="content-card">
                      <div className="card-header">
                        <div className="content-info">
                          <h3>{content.title}</h3>
                          <p className="subtitle">{content.subtitle}</p>
                          <div className="meta-info">
                            <span className="category">{content.category}</span>
                            <span className="subcategory">
                              {content.subcategory}
                            </span>
                          </div>
                        </div>
                        <div className="status-badge">
                          <span className={`status ${content.status}`}>
                            {content.status}
                          </span>
                        </div>
                      </div>

                      <div className="card-stats">
                        <div className="stat">
                          <Eye size={14} />
                          <span>{content.viewCount || 0} views</span>
                        </div>
                        <div className="stat">
                          <Calendar size={14} />
                          <span>
                            {new Date(content.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          onClick={() => handlePreview(content)}
                          className="btn-secondary small"
                        >
                          <Eye size={16} />
                          Preview
                        </button>
                        <button
                          onClick={() => handleEdit(content)}
                          className="btn-secondary small"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(content._id)}
                          className="btn-secondary small"
                        >
                          {content.status === "published" ? (
                            <ToggleLeft size={16} />
                          ) : (
                            <ToggleRight size={16} />
                          )}
                          Toggle
                        </button>
                        <button
                          onClick={() => handleDelete(content._id)}
                          className="btn-danger small"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="btn-secondary"
                    >
                      Previous
                    </button>
                    <span className="page-info">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="analytics-tab">
            {analyticsLoading ? (
              <div className="loading-state">
                <RefreshCw className="spinning" size={24} />
                <p>Loading analytics...</p>
              </div>
            ) : (
              <div className="analytics-grid">
                <div className="analytics-card">
                  <div className="card-header">
                    <h3>Total Contents</h3>
                    <FileText size={24} />
                  </div>
                  <div className="card-value">
                    {analyticsData?.data?.totalContents || 0}
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-header">
                    <h3>Published</h3>
                    <TrendingUp size={24} />
                  </div>
                  <div className="card-value">
                    {analyticsData?.data?.publishedContents || 0}
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-header">
                    <h3>Total Views</h3>
                    <Eye size={24} />
                  </div>
                  <div className="card-value">
                    {analyticsData?.data?.totalViews || 0}
                  </div>
                </div>

                <div className="analytics-card">
                  <div className="card-header">
                    <h3>Active Users</h3>
                    <Users size={24} />
                  </div>
                  <div className="card-value">
                    {analyticsData?.data?.activeUsers || 0}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <CreateEditModal
          content={editingContent}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            queryClient.invalidateQueries("knowMoreContents");
          }}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal content={showPreview} onClose={closePreview} />
      )}
    </div>
  );
};

// Create/Edit Modal Component - For subcategory-based content
const CreateEditModal = ({ content, onClose, onSuccess }) => {
  const [modalTab, setModalTab] = useState("info");
  const [formData, setFormData] = useState({
    // Existing fields
    category: content?.category || "",
    subcategory: content?.subcategory || "",
    title: content?.title || "",
    subtitle: content?.subtitle || "",
    content: content?.sections?.[0]?.content || "",
    status: content?.status || "draft",
    contentBlocks: content?.contentBlocks || [], // Add this line

   
    specifications: content?.sections?.[0]?.specifications || [
      { name: "", value: "" },
    ],
    images: content?.images || [],

    // Enhanced fields (using your existing schema)
    highlights: content?.highlights || [
      { icon: "⭐", title: "", description: "" },
    ],
    faqs: content?.faqs || [{ question: "", answer: "" }],
    videos: content?.videos || [],
    cta: {
      enabled: content?.cta?.enabled !== false,
      text: content?.cta?.text || "Learn More",
      action: content?.cta?.action || "contact",
      phoneNumber: content?.cta?.phoneNumber || "",
      email: content?.cta?.email || "",
    },
    metaTitle: content?.metaTitle || "",
    metaDescription: content?.metaDescription || "",
    keywords: content?.keywords || [],
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Specification management functions
  const addSpecification = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { name: "", value: "" }],
    }));
  };

  const removeSpecification = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const updateSpecification = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec
      ),
    }));
  };

  // Highlights management
  const addHighlight = () => {
    setFormData((prev) => ({
      ...prev,
      highlights: [
        ...prev.highlights,
        { icon: "⭐", title: "", description: "" },
      ],
    }));
  };

  const removeHighlight = (index) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const updateHighlight = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.map((highlight, i) =>
        i === index ? { ...highlight, [field]: value } : highlight
      ),
    }));
  };

  // FAQs management
  const addFAQ = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const removeFAQ = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const updateFAQ = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) =>
        i === index ? { ...faq, [field]: value } : faq
      ),
    }));
  };

  // Videos management
  const addVideo = () => {
    setFormData((prev) => ({
      ...prev,
      videos: [...prev.videos, { url: "", title: "" }],
    }));
  };

  const removeVideo = (index) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const updateVideo = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.map((video, i) =>
        i === index ? { ...video, [field]: value } : video
      ),
    }));
  };
  // Content block handlers
  const addContentBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: type === 'text' ? '' : type === 'image' ? { url: '', alt: '', caption: '' } : { 
        image: { url: '', alt: '', caption: '' }, 
        text: '', 
        layout: 'left' 
      },
      position: formData.contentBlocks.length,
      settings: {
        alignment: 'left',
        padding: 'medium',
        backgroundColor: '#ffffff'
      }
    };
    
    setFormData(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock]
    }));
  };

  const updateContentBlock = (index, updatedBlock) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block, i) => 
        i === index ? updatedBlock : block
      )
    }));
  };

  const deleteContentBlock = (index) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter((_, i) => i !== index)
    }));
  };

  const moveContentBlock = (fromIndex, toIndex) => {
    setFormData(prev => {
      const blocks = [...prev.contentBlocks];
      const [movedBlock] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, movedBlock);
      
      // Update positions
      return {
        ...prev,
        contentBlocks: blocks.map((block, index) => ({
          ...block,
          position: index
        }))
      };
    });
  };
  // Add image upload handler
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setIsLoading(true);
    try {
      // Create FormData for upload
      const uploadData = new FormData();
      files.forEach((file) => {
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 2MB`);
          return;
        }
        uploadData.append("images", file);
      });

      // Upload images using the API
      const response = await knowMoreAPI.uploadImages(uploadData);

      // Add uploaded images to formData
     const newImages = response.data.images.map((image, index) => ({
  url: image.url || image.path,
  alt: `Content image ${formData.images.length + index + 1}`,
  caption: `Image ${formData.images.length + index + 1}`
}));

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));

      toast.success("Images uploaded successfully");
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error(error.response?.data?.message || "Failed to upload images");
    } finally {
      setIsLoading(false);
    }
  };

  // Add remove image handler
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.subcategory || !formData.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate specifications - at least one complete specification is required
    const validSpecs = formData.specifications.filter(
      (spec) => spec.name && spec.name.trim() && spec.value && spec.value.trim()
    );

    if (validSpecs.length === 0) {
      toast.error(
        "Please add at least one complete specification (name and value)"
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log("💾 Saving know more content:", formData);

      // Prepare the payload to match backend validation requirements
      const payload = {
        // Required fields from backend validation
        type: "subcategory", // Required: must be 'product' or 'subcategory'
        title: formData.title.trim(), // Required: min 1, max 200 characters

        // Subcategory-specific required fields
        category: formData.category, // Required for subcategory type
        subcategory: formData.subcategory, // Required for subcategory type

        // Optional fields
        subtitle: formData.subtitle || "", // Optional: max 300 characters

        // Convert our specifications to the expected format
        sections: [
          {
            heading: "Specifications", // ✅ FIXED: Use 'heading' instead of 'title'
            content: formData.content || "",
            specifications: validSpecs,
          },
        ],

        // Optional arrays
                // Use actual form data instead of empty arrays
        highlights: formData.highlights.filter(h => h.title && h.title.trim() && h.description && h.description.trim()),
        faqs: formData.faqs.filter(f => f.question && f.question.trim() && f.answer && f.answer.trim()),
        videos: formData.videos || [],
        technicalSpecs: validSpecs, // Duplicate for backward compatibility
        // Additional fields for our system
        contentId: `${formData.category}_${formData.subcategory}`,
        status: formData.status,
        images: formData.images || [],
        contentBlocks: formData.contentBlocks || [], // Add this line
      };

      console.log("📤 Final payload:", payload);

      if (content?._id) {
        await knowMoreAPI.updateContent(content._id, payload);
        toast.success("Content updated successfully!");
      } else {
        await knowMoreAPI.createContent(payload);
        toast.success("Content created successfully!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Save failed:", error);

      // Better error handling
      let errorMessage = "An error occurred";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        errorMessage = validationErrors.map((err) => err.msg).join(", ");
      } else {
        errorMessage = content?._id
          ? "Failed to update content"
          : "Failed to create content";
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content large-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{content ? "Edit" : "Create"} Know More Content</h3>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab ${modalTab === "info" ? "active" : ""}`}
            onClick={() => setModalTab("info")}
          >
            <FileText size={16} />
            Basic Info
          </button>
          <button
            className={`tab ${modalTab === "specifications" ? "active" : ""}`}
            onClick={() => setModalTab("specifications")}
          >
            <Settings size={16} />
            Specifications
          </button>
          <button
            className={`tab ${modalTab === "builder" ? "active" : ""}`}
            onClick={() => setModalTab("builder")}
          >
            <Edit size={16} />
            Content Builder
          </button>
          <button
            className={`tab ${modalTab === "highlights" ? "active" : ""}`}
            onClick={() => setModalTab("highlights")}
          >
            <Star size={16} />
            Highlights
          </button>
          <button
            className={`tab ${modalTab === "media" ? "active" : ""}`}
            onClick={() => setModalTab("media")}
          >
            <Image size={16} />
            Media
          </button>
          <button
            className={`tab ${modalTab === "faqs" ? "active" : ""}`}
            onClick={() => setModalTab("faqs")}
          >
            <HelpCircle size={16} />
            FAQs
          </button>
          <button
            className={`tab ${modalTab === "cta" ? "active" : ""}`}
            onClick={() => setModalTab("cta")}
          >
            <Phone size={16} />
            Call to Action
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {modalTab === "info" && (
            <div className="form-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="aggregate">Aggregate</option>
                    <option value="sand">Sand</option>
                    <option value="tmt_steel">TMT Steel</option>
                    <option value="bricks_blocks">Bricks & Blocks</option>
                    <option value="cement">Cement</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subcategory *</label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) =>
                      handleInputChange("subcategory", e.target.value)
                    }
                    disabled={!formData.category}
                    required
                  >
                    <option value="">Select Subcategory</option>
                    {getSubcategoryOptions(formData.category).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter content title"
                  maxLength={200}
                  required
                />
                <small className="field-help">Maximum 200 characters</small>
              </div>

              <div className="form-group">
                <label>Subtitle</label>
                <textarea
                  value={formData.subtitle}
                  onChange={(e) =>
                    handleInputChange("subtitle", e.target.value)
                  }
                  placeholder="Brief subtitle or overview"
                  maxLength={300}
                  rows="3"
                />
                <small className="field-help">Maximum 300 characters</small>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          )}

          {modalTab === "specifications" && (
            <div className="form-content">
              <div className="specifications-section">
                <div className="section-header">
                  <h4>Product Specifications</h4>
                  <button
                    type="button"
                    onClick={addSpecification}
                    className="btn-secondary small"
                  >
                    <Plus size={16} />
                    Add Specification
                  </button>
                </div>

                {formData.specifications.map((spec, index) => (
                  <div key={index} className="specification-row">
                    <div className="form-group">
                      <input
                        type="text"
                        value={spec.name}
                        onChange={(e) =>
                          updateSpecification(index, "name", e.target.value)
                        }
                        placeholder={getSpecificationPlaceholder(
                          formData.category,
                          formData.subcategory,
                          "name"
                        )}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) =>
                          updateSpecification(index, "value", e.target.value)
                        }
                        placeholder={getSpecificationPlaceholder(
                          formData.category,
                          formData.subcategory,
                          "value"
                        )}
                      />
                    </div>
                    {formData.specifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSpecification(index)}
                        className="btn-danger small"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}

                {formData.specifications.length === 0 && (
                  <p className="empty-state">
                    No specifications added yet. Click "Add Specification" to
                    get started.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Detailed Content</label>
                <textarea
                  value={formData.content || ""}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="Detailed content about the product..."
                  rows="8"
                />
              </div>
            </div>
          )}
              {modalTab === "builder" && (
                <div className="form-section">
                  <h3>Content Builder</h3>
                  <p className="section-description">
                    Create flexible content blocks with text, images, and rich formatting.
                  </p>

                  <div className="content-builder">
                    <div className="builder-toolbar">
                      <button
                        type="button"
                        onClick={() => addContentBlock('text')}
                        className="btn-secondary"
                      >
                        <Type size={16} />
                        Add Text Block
                      </button>
                      <button
                        type="button"
                        onClick={() => addContentBlock('image')}
                        className="btn-secondary"
                      >
                        <ImageIcon size={16} />
                        Add Image Block
                      </button>
                      <button
                        type="button"
                        onClick={() => addContentBlock('imageText')}
                        className="btn-secondary"
                      >
                        <Layout size={16} />
                        Add Image + Text Block
                      </button>
                    </div>

                    <div className="content-blocks">
                      {formData.contentBlocks.map((block, index) => (
                        <ContentBlock
                          key={block.id}
                          block={block}
                          index={index}
                          onUpdate={(updatedBlock) => updateContentBlock(index, updatedBlock)}
                          onDelete={() => deleteContentBlock(index)}
                          onMove={(fromIndex, toIndex) => moveContentBlock(fromIndex, toIndex)}
                        />
                      ))}
                      
                      {formData.contentBlocks.length === 0 && (
                        <div className="empty-builder">
                          <Layout size={48} className="empty-icon" />
                          <h4>No content blocks yet</h4>
                          <p>Use the buttons above to add your first content block</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
          {/* Highlights Tab */}
          {modalTab === "highlights" && (
            <div className="form-content">
              <div className="highlights-section">
                <div className="section-header">
                  <h4>Key Highlights</h4>
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="btn-secondary small"
                  >
                    <Plus size={16} />
                    Add Highlight
                  </button>
                </div>

                {formData.highlights.map((highlight, index) => (
                  <div key={index} className="highlight-row">
                    <div className="form-group">
                      <input
                        type="text"
                        value={highlight.icon}
                        onChange={(e) =>
                          updateHighlight(index, "icon", e.target.value)
                        }
                        placeholder="Icon (emoji or text)"
                        maxLength={10}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        value={highlight.title}
                        onChange={(e) =>
                          updateHighlight(index, "title", e.target.value)
                        }
                        placeholder="Highlight title"
                        maxLength={100}
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        value={highlight.description}
                        onChange={(e) =>
                          updateHighlight(index, "description", e.target.value)
                        }
                        placeholder="Highlight description"
                        rows="3"
                        maxLength={300}
                      />
                    </div>
                    {formData.highlights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHighlight(index)}
                        className="btn-danger small"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Tab */}
          {modalTab === "media" && (
            <div className="form-content">
              <div className="form-section">
                <h4>📸 Images</h4>

                <div className="image-upload">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isLoading}
                    id="image-upload"
                    style={{ display: "none" }}
                  />

                  <label htmlFor="image-upload" className="image-upload-label">
                    <div className="upload-content">
                      <div className="upload-icon">📸</div>
                      <div className="upload-text">
                        <strong>Click to upload images</strong>
                        <span>or drag and drop</span>
                      </div>
                      <div className="upload-note">
                        PNG, JPG up to 2MB each (max 5 images)
                      </div>
                    </div>
                  </label>
                </div>

                {formData.images && formData.images.length > 0 && (
                  <div className="image-preview-grid">
                    {formData.images.map((image, index) => (
                      <div key={index} className="image-preview">
                        <img
                          src={image.url || image}
                          alt={image.alt || `Image ${index + 1}`}
                          onError={(e) => {
                            e.target.src = "/placeholder-product.jpg";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="remove-image-btn"
                        >
                          ✕
                        </button>
                        <div className="image-caption">
                          <input
                            type="text"
                            placeholder="Add caption..."
                            value={image.caption || ""}
                            onChange={(e) => {
                              const newImages = [...formData.images];
                              newImages[index].caption = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                images: newImages,
                              }));
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-section">
                <h4>🎥 Videos</h4>
                <div className="form-group">
                  <label>YouTube Video URLs</label>
                  <textarea
                    value={(formData.videos || []).map((v) => v.url).join("\n")}
                    onChange={(e) => {
                      const urls = e.target.value
                        .split("\n")
                        .filter((url) => url.trim());
                      const videos = urls.map((url) => ({
                        url: url.trim(),
                        title: "Video",
                        thumbnail: "",
                      }));
                      setFormData((prev) => ({ ...prev, videos }));
                    }}
                    placeholder="Enter YouTube URLs, one per line"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          )}

          {/* FAQs Tab */}
          {modalTab === "faqs" && (
            <div className="form-content">
              <div className="faqs-section">
                <div className="section-header">
                  <h4>Frequently Asked Questions</h4>
                  <button
                    type="button"
                    onClick={addFAQ}
                    className="btn-secondary small"
                  >
                    <Plus size={16} />
                    Add FAQ
                  </button>
                </div>

                {formData.faqs.map((faq, index) => (
                  <div key={index} className="faq-row">
                    <div className="form-group">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) =>
                          updateFAQ(index, "question", e.target.value)
                        }
                        placeholder="Question"
                        maxLength={300}
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        value={faq.answer}
                        onChange={(e) =>
                          updateFAQ(index, "answer", e.target.value)
                        }
                        placeholder="Answer"
                        rows="4"
                        maxLength={1000}
                      />
                    </div>
                    {formData.faqs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFAQ(index)}
                        className="btn-danger small"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Tab */}
          {modalTab === "cta" && (
            <div className="form-content">
              <div className="cta-section">
                <h4>Call to Action</h4>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.cta.enabled}
                      onChange={(e) =>
                        handleInputChange("cta", {
                          ...formData.cta,
                          enabled: e.target.checked,
                        })
                      }
                    />
                    Enable Call to Action
                  </label>
                </div>

                {formData.cta.enabled && (
                  <>
                    <div className="form-group">
                      <label>CTA Text</label>
                      <input
                        type="text"
                        value={formData.cta.text}
                        onChange={(e) =>
                          handleInputChange("cta", {
                            ...formData.cta,
                            text: e.target.value,
                          })
                        }
                        placeholder="Learn More"
                        maxLength={50}
                      />
                    </div>

                    <div className="form-group">
                      <label>Action Type</label>
                      <select
                        value={formData.cta.action}
                        onChange={(e) =>
                          handleInputChange("cta", {
                            ...formData.cta,
                            action: e.target.value,
                          })
                        }
                      >
                        <option value="contact">Contact</option>
                        <option value="quote">Get Quote</option>
                        <option value="external_link">External Link</option>
                        <option value="modal">Open Modal</option>
                      </select>
                    </div>

                    {formData.cta.action === "contact" && (
                      <>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input
                            type="tel"
                            value={formData.cta.phoneNumber}
                            onChange={(e) =>
                              handleInputChange("cta", {
                                ...formData.cta,
                                phoneNumber: e.target.value,
                              })
                            }
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            value={formData.cta.email}
                            onChange={(e) =>
                              handleInputChange("cta", {
                                ...formData.cta,
                                email: e.target.value,
                              })
                            }
                            placeholder="contact@company.com"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  {content ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {content ? "Update" : "Create"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const ContentBlock = ({ block, index, onUpdate, onDelete, onMove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const handleImageUpload = async (file, field = 'image') => {
    if (!file) return;
    
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      
      const response = await knowMoreAPI.uploadImages(formData);
      if (response && response.data && response.success && response.data.images && response.data.images[0]) {

        const imageData = {
          url: response.data.images[0].url,
          alt: response.data.images[0].alt,
          caption: block.type === 'imageText' ? block.content[field].caption : block.content.caption
        };
        
        if (block.type === 'imageText') {
          onUpdate({
            ...block,
            content: {
              ...block.content,
              [field]: imageData
            }
          });
        } else {
          onUpdate({
            ...block,
            content: imageData
          });
        }
        
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Image upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="content-block">
      <div className="block-header">
        <div className="block-info">
          <span className="block-type">{block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block</span>
          <span className="block-position">Position {index + 1}</span>
        </div>
        
        <div className="block-actions">
          {index > 0 && (
            <button type="button" onClick={() => onMove(index, index - 1)} className="btn-icon">
              <ChevronUp size={16} />
            </button>
          )}
          {index < (block.totalBlocks || 0) - 1 && (
            <button type="button" onClick={() => onMove(index, index + 1)} className="btn-icon">
              <ChevronDown size={16} />
            </button>
          )}
          <button 
            type="button" 
            onClick={() => setIsEditing(!isEditing)} 
            className={`btn-icon ${isEditing ? 'active' : ''}`}
          >
            <Edit size={16} />
          </button>
          <button type="button" onClick={onDelete} className="btn-icon danger">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="block-content">
        {block.type === 'text' && (
          <div className="text-block">
            {isEditing ? (
              <ReactQuill
                value={block.content}
                onChange={(value) => onUpdate({ ...block, content: value })}
                theme="snow"
                placeholder="Enter your content..."
              />
            ) : (
              <div 
                className="text-preview" 
                dangerouslySetInnerHTML={{ __html: block.content || '<p>Click edit to add content</p>' }}
              />
            )}
          </div>
        )}

        {block.type === 'image' && (
          <div className="image-block">
            {block.content.url ? (
              <div className="image-preview">
                <img src={block.content.url} alt={block.content.alt} />
                {isEditing && (
                  <div className="image-controls">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0])}
                      style={{ display: 'none' }}
                      id={`image-${block.id}`}
                    />
                    <label htmlFor={`image-${block.id}`} className="btn-secondary">
                      {imageUploading ? 'Uploading...' : 'Change Image'}
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="image-placeholder">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                  id={`image-${block.id}`}
                />
                <label htmlFor={`image-${block.id}`} className="upload-label">
                  <ImageIcon size={48} />
                  <span>{imageUploading ? 'Uploading...' : 'Click to upload image'}</span>
                </label>
              </div>
            )}
            
            {isEditing && (
              <div className="image-meta">
                <input
                  type="text"
                  placeholder="Alt text"
                  value={block.content.alt}
                  onChange={(e) => onUpdate({
                    ...block,
                    content: { ...block.content, alt: e.target.value }
                  })}
                />
                <input
                  type="text"
                  placeholder="Caption"
                  value={block.content.caption}
                  onChange={(e) => onUpdate({
                    ...block,
                    content: { ...block.content, caption: e.target.value }
                  })}
                />
              </div>
            )}
          </div>
        )}

        {block.type === 'imageText' && (
          <div className={`image-text-block layout-${block.content.layout}`}>
            <div className="image-section">
              {block.content.image.url ? (
                <img src={block.content.image.url} alt={block.content.image.alt} />
              ) : (
                <div className="image-placeholder">
                  <ImageIcon size={24} />
                  <span>No image</span>
                </div>
              )}
              
              {isEditing && (
                <div className="image-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0], 'image')}
                    style={{ display: 'none' }}
                    id={`imagetext-${block.id}`}
                  />
                  <label htmlFor={`imagetext-${block.id}`} className="btn-secondary">
                    {imageUploading ? 'Uploading...' : 'Upload Image'}
                  </label>
                </div>
              )}
            </div>
            
            <div className="text-section">
              {isEditing ? (
                <ReactQuill
                  value={block.content.text}
                  onChange={(value) => onUpdate({
                    ...block,
                    content: { ...block.content, text: value }
                  })}
                  theme="snow"
                  placeholder="Enter your text content..."
                />
              ) : (
                <div 
                  className="text-preview"
                  dangerouslySetInnerHTML={{ __html: block.content.text || '<p>Click edit to add text</p>' }}
                />
              )}
            </div>
            
            {isEditing && (
              <div className="layout-controls">
                <label>
                  <input
                    type="radio"
                    name={`layout-${block.id}`}
                    value="left"
                    checked={block.content.layout === 'left'}
                    onChange={(e) => onUpdate({
                      ...block,
                      content: { ...block.content, layout: e.target.value }
                    })}
                  />
                  Image Left
                </label>
                <label>
                  <input
                    type="radio"
                    name={`layout-${block.id}`}
                    value="right"
                    checked={block.content.layout === 'right'}
                    onChange={(e) => onUpdate({
                      ...block,
                      content: { ...block.content, layout: e.target.value }
                    })}
                  />
                  Image Right
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
// Preview Modal Component
const PreviewModal = ({ content, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Preview: {content.title}</h3>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="preview-content">
          <div className="preview-header">
            <h1>{content.title}</h1>
            {content.subtitle && <p className="subtitle">{content.subtitle}</p>}
            <div className="meta-info">
              <span className="category">{content.category}</span>
              <span className="subcategory">{content.subcategory}</span>
              <span className={`status ${content.status}`}>
                {content.status}
              </span>
            </div>
          </div>

          {content.sections && content.sections.length > 0 && (
            <div className="specifications-preview">
              <h3>Specifications</h3>
              {content.sections[0].specifications && (
                <div className="specs-grid">
                  {content.sections[0].specifications.map((spec, index) => (
                    <div key={index} className="spec-item">
                      <strong>{spec.name}:</strong> {spec.value}
                    </div>
                  ))}
                </div>
              )}
              {content.sections[0].content && (
                <div className="content-text">
                  <p>{content.sections[0].content}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowMoreManagementPage;
