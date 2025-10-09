import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  BarChart3, 
  Package, 
  Grid3X3, 
  Menu,
  LogOut, 
  X,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Star,
  BookOpen,
  Gift,
  Settings
} from "lucide-react";
import { fetchAllCategories } from "../service/service";

export default function Sidebar({ className = "", isMobileOpen = false, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const router = useRouter();
  
  // Load categories for product dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetchAllCategories(router);
        if (response.success) {
          setCategories(response.data || []);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [router]);

  // Update active module based on the current URL path
  useEffect(() => {
    const currentPath = router.asPath || router.pathname;
    console.log("Current path:", currentPath); // Debug log
    
    if (currentPath.includes("/dashboard")) {
      setActiveModule("dashboard");
      setActiveCategory("");
    } else if (currentPath.includes("/products/")) {
      setActiveModule("product");
      setProductDropdownOpen(true);
      // Extract category ID from URL like /products/categoryId
      const pathParts = currentPath.split("/products/");
      if (pathParts.length > 1) {
        const categoryId = pathParts[1].split("/")[0].split("?")[0]; // Handle query params too
        console.log("Extracted category ID:", categoryId); // Debug log
        setActiveCategory(categoryId);
      }
    } else if (currentPath.includes("/product")) {
      setActiveModule("product");
      setActiveCategory("");
    } else if (currentPath.includes("/categories")) {
      setActiveModule("categories");
      setActiveCategory("");
    } else if (currentPath.includes("/content")) {
      setActiveModule("content");
      setActiveCategory("");
    } else if (currentPath.includes("/stats")) {
      setActiveModule("stats");
      setActiveCategory("");
    } else if (currentPath.includes("/users")) {
      setActiveModule("users");
      setActiveCategory("");
    } else if (currentPath.includes("/admin/orders")) {
      setActiveModule("orders");
      setActiveCategory("");
    } else if (currentPath.includes("/reviews")) {
      setActiveModule("reviews");
      setActiveCategory("");
    } else if (currentPath.includes("/review-tags")) {
      setActiveModule("review-tags");
      setActiveCategory("");
    } else if (currentPath.includes("/members")) {
      setActiveModule("members");
      setActiveCategory("");
    } else if (currentPath.includes("/contacts")) {
      setActiveModule("contacts");
      setActiveCategory("");
    } else if (currentPath.includes("/rewards")) {
      setActiveModule("rewards");
      setActiveCategory("");
    } else if (currentPath.includes("/settings")) {
      setActiveModule("settings");
      setActiveCategory("");
    }
  }, [router.asPath, router.pathname]);

  const getModuleClasses = (moduleName) => {
    const baseClasses = `w-full flex items-center justify-start p-2 rounded-lg ${
      collapsed ? "px-2" : "px-4"
    }`;
    
    if (activeModule === moduleName) {
      return `${baseClasses} bg-white text-[#80A6F7]`;
    } else {
      return `${baseClasses} text-white hover:bg-blue-600`;
    }
  };

  const getCategoryClasses = (categoryId) => {
    const baseClasses = "w-full text-left px-4 py-2 text-sm rounded";
    
    // console.log("Category ID:", categoryId, "Active Category:", activeCategory, "Match:", activeCategory === categoryId);
    
    if (activeCategory === categoryId) {
      return `${baseClasses} bg-white text-blue-600 font-medium`;
    } else {
      return `${baseClasses} text-blue-100 hover:bg-blue-600`;
    }
  };

  return (
    <>
      <div
        className={`sidebar-fixed bg-gradient-to-b from-[#80A6F7] to-[#80A6F7] text-white transition-transform duration-300 transform h-screen flex flex-col ${
          collapsed && typeof window !== 'undefined' && window.innerWidth >= 768 ? "w-[70px]" : "w-[240px]"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${className}`}
      >
        {/* Header with Logo */}
        <div className="flex-shrink-0">
          <div className="flex items-center px-4 py-6">
            <div className="flex items-center">
              {!collapsed && (
                <a 
                  href="https://main.d2hdxwwdjspab.amplifyapp.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center"
                >
                  <div className="w-32 h-32 rounded-full ml-6 flex items-center justify-center mb-2">
                    <img src="/logo.png" alt="" />
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>

          {/* Navigation with scrolling */}
          <nav className="flex-1 overflow-y-auto px-2 pb-4">
            <div className="space-y-1">
              <Link href="/dashboard">
                <button
                  className={getModuleClasses("dashboard")}
                >
                  <BarChart3 className={`h-5 w-5 ${activeModule === "dashboard" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && <span className="ml-2">Dashboard</span>}
                </button>
              </Link>
              
              <div className="relative">
                <button
                  onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                  className={getModuleClasses("product")}
                >
                  <Package className={`h-5 w-5 ${activeModule === "product" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && (
                    <>
                      <span className="ml-2">Product</span>
                      {productDropdownOpen ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </>
                  )}
                </button>
                
                {/* Product Dropdown */}
                {productDropdownOpen && !collapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {categoriesLoading ? (
                      <div className="px-4 py-2 text-sm text-blue-100 italic">Loading categories...</div>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <Link key={category._id} href={`/products/${category._id}`}>
                          <button className={getCategoryClasses(category._id)}>
                            {category.category}
                          </button>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-blue-100 italic">No categories found</div>
                    )}
                  </div>
                )}
              </div>
              
              <Link href="/categories">
                <button
                  className={getModuleClasses("categories")}
                >
                  <Grid3X3 className={`h-5 w-5 ${activeModule === "categories" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && <span className="ml-2">Categories</span>}
                </button>
              </Link>

              <Link href="/content">
                <button
                  className={getModuleClasses("content")}
                >
                  <BookOpen className={`h-5 w-5 ${activeModule === "content" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && <span className="ml-2">Content</span>}
                </button>
              </Link>

              <Link href="/stats">
                <button
                  className={getModuleClasses("stats")}
                >
                  <BarChart3 className={`h-5 w-5 ${activeModule === "stats" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && <span className="ml-2">Stats</span>}
                </button>
              </Link>
              
              <Link href="/users">
                <button
                  className={getModuleClasses("users")}
                >
                  <Users className={`h-5 w-5 ${activeModule === "users" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && <span className="ml-2">Users</span>}
                </button>
              </Link>

              <Link href="/members">
                <button
                  className={getModuleClasses("members")}
                >
                  <Users className={`h-5 w-5 ${activeModule === "members" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && <span className="ml-2">Members</span>}
                </button>
              </Link>

              <Link href="/contacts">
                <button
                  className={getModuleClasses("contacts")}
                >
                  <FileText className={`h-5 w-5 ${activeModule === "contacts" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && <span className="ml-2">Contacts</span>}
                </button>
              </Link>

            <Link href="/reviews">
              <button
                className={getModuleClasses("reviews")}
              >
                <Star className={`h-5 w-5 ${activeModule === "reviews" ? "text-[#80A6F7]" : ""}`} />
                {!collapsed && <span className="ml-2">Reviews</span>}
              </button>
            </Link>

            <Link href="/review-tags">
              <button
                className={getModuleClasses("review-tags")}
              >
                <Star className={`h-5 w-5 ${activeModule === "review-tags" ? "text-[#80A6F7]" : ""}`} />
                {!collapsed && <span className="ml-2">Research Tags</span>}
              </button>
            </Link>

              <Link href="/admin/orders">
                <button
                  className={getModuleClasses("orders")}
                >
                  <FileText className={`h-5 w-5 ${activeModule === "orders" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && <span className="ml-2">Orders</span>}
                </button>
              </Link>

              <Link href="/rewards">
                <button
                  className={getModuleClasses("rewards")}
                >
                  <Gift className={`h-5 w-5 ${activeModule === "rewards" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && <span className="ml-2">Rewards</span>}
                </button>
              </Link>

              <Link href="/settings">
                <button
                  className={getModuleClasses("settings")}
                >
                  <Settings className={`h-5 w-5 ${activeModule === "settings" ? "text-[#80A6F7]" : ""}`} />
                  {!collapsed && <span className="ml-2">Settings</span>}
                </button>
              </Link>
            </div>
          </nav>
      </div>

    </>
  );
}