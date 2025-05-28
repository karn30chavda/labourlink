
export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "LabourLink",
  description:
    "ConstructConnect: Your go-to marketplace for construction labour. Find skilled workers or post job openings with ease.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Find Jobs",
      href: "/jobs",
    },
    {
      title: "Find Labour",
      href: "/search-labour",
    },
  ],
  footerNav: [
    {
      title: "About Us",
      href: "/about",
    },
    {
      title: "Contact",
      href: "/contact",
    },
    {
      title: "Terms of Service",
      href: "/terms",
    },
    {
      title: "Privacy Policy",
      href: "/privacy",
    },
  ],
  userNav: {
    labour: [
      { title: "Dashboard", href: "/labour/dashboard" },
      { title: "My Profile", href: "/labour/profile" },
      { title: "My Applications", href: "/labour/applications" },
      { title: "Subscription", href: "/labour/subscription" },
    ],
    customer: [
      { title: "Dashboard", href: "/customer/dashboard" },
      { title: "Post a Job", href: "/customer/post-job" },
      { title: "My Job Posts", href: "/customer/jobs" },
      // { title: "Subscription", href: "/customer/subscription" }, // Removed this line
    ],
    admin: [
      { title: "Dashboard", href: "/admin/dashboard" },
      { title: "Manage Users", href: "/admin/users" },
      { title: "Manage Jobs", href: "/admin/jobs" },
      { title: "Approve Posts", href: "/admin/approvals" },
      { title: "Payments Log", href: "/admin/payments" },
    ],
  },
  roles: {
    labour: "Labour",
    customer: "Customer",
    admin: "Admin",
  },
  skills: [
    "Electrician",
    "Mason",
    "Plumber",
    "Carpenter",
    "Painter",
    "Welder",
    "Roofer",
    "HVAC Technician",
    "Heavy Equipment Operator",
    "General Laborer",
    "Site Supervisor",
    "Project Manager",
    "Surveyor",
    "Architect",
    "Civil Engineer",
  ],
  cities: [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Ahmedabad",
    "Chennai",
    "Kolkata",
    "Surat",
    "Pune",
    "Jaipur"
  ],
  jobDurations: [
    "1 Day",
    "2-3 Days",
    "1 Week",
    "2 Weeks",
    "1 Month",
    "1-3 Months",
    "3-6 Months",
    "6+ Months",
    "Ongoing",
    "Flexible"
  ],
  paymentPlans: {
    labour: [
      { id: "labour_monthly_99", name: "Monthly Access", price: 99, currency: "INR", interval: "month", description: "Access all job applications for one month." },
      { id: "labour_yearly_499", name: "Yearly Access", price: 499, currency: "INR", interval: "year", description: "Access all job applications for one year. Best value!" },
    ],
    customer: [
      { id: "customer_basic_5posts", name: "Basic Job Pack", price: 199, currency: "INR", posts: 5, description: "Post up to 5 jobs. Ideal for small projects." },
      { id: "customer_premium_15posts", name: "Premium Job Pack", price: 499, currency: "INR", posts: 15, description: "Post up to 15 jobs. Perfect for ongoing needs." },
    ]
  }
}
