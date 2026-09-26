import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/auth/LoginPage";
import AdminLayout from "@/layouts/AdminLayout";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import CountriesPage from "@/pages/countries/CountriesPage";
import CompaniesPage from "@/pages/companies/CompaniesPage";
import BrandsPage from "@/pages/brands/BrandsPage";
import ProductsPage from "@/pages/products/ProductsPage";
import AliasesPage from "@/pages/aliases/AliasesPage";
import ReportsPage from "@/pages/reports/ReportsPage";
import UsersPage from "@/pages/users/UsersPage";
import ClassificationsPage from "@/pages/classifications/ClassificationsPage";
import NewsPage from "@/pages/news/NewsPage";
import CommunityChangesPage from "@/pages/community/CommunityChangesPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "countries", element: <CountriesPage /> },
      { path: "companies", element: <CompaniesPage /> },
      { path: "brands", element: <BrandsPage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "aliases", element: <AliasesPage /> },
      { path: "classifications", element: <ClassificationsPage /> },
      { path: "news", element: <NewsPage /> },
      { path: "community", element: <CommunityChangesPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "users", element: <UsersPage /> },
    ],
  },
  {
    path: "/",
    element: <LoginPage />,
  },
]);
