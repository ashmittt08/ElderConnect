import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useResponsive from "../hooks/useResponsive";




const colors = {
  bg: "#0B1120",
  card: "#141C2F",
  cardAlt: "#182236",
  border: "#1E2D45",
  primary: "#4799EB",
  primaryGlow: "#4799EB30",
  success: "#22C55E",
  warning: "#F59E0B",
  accent: "#A78BFA",
  text: "#F1F5F9",
  muted: "#8899B0",
  subtle: "#5A6A80",
  dark: "#060A14",
};

export default function HomeScreen({ navigation }) {
  const responsive = useResponsive();
  const isMobile = responsive.isMobile;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Navbar ─── */}
        <View style={styles.navbar}>
          <View style={styles.navLeft}>
            <Text style={styles.logoIcon}>🤝</Text>
            <Text style={styles.logoText}>ElderConnect</Text>
          </View>
          {!isMobile && (
            <View style={styles.navLinks}>
              {["Home", "About Us", "Benefits", "Contact"].map((link) => (
                <TouchableOpacity key={link}>
                  <Text style={styles.navLink}>{link}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={styles.navRight}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginBtnText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate("RoleSelect")}
            >
              <Text style={styles.registerBtnText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Hero Section ─── */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, isMobile && { fontSize: 36 }]}>
            Connecting Generations,{"\n"}Enriching Lives
          </Text>
          <Text style={styles.heroSubtitle}>
            ElderConnect brings together seniors, volunteers, and NGOs to create a supportive community for aging with dignity.
          </Text>
          <View style={[styles.heroButtons, isMobile && { flexDirection: "column" }]}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => navigation.navigate("RoleSelect")}
            >
              <Text style={styles.heroPrimaryBtnText}>Get Started →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.heroSecondaryBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={[styles.statsRow, isMobile && { flexDirection: "column" }]}>
            {[
              { value: "10K+", label: "Active Users" },
              { value: "500+", label: "Volunteers" },
              { value: "50+", label: "NGO Partners" },
              { value: "98%", label: "Satisfaction" },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Features Section ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OUR SERVICES</Text>
          <Text style={[styles.sectionTitle, isMobile && { fontSize: 28 }]}>
            Tailored for Our Community
          </Text>
          <Text style={styles.sectionSubtitle}>
            Whether you are looking for help, want to give back, or manage an organization, we have the tools for you.
          </Text>

          <View style={[styles.featuresGrid, isMobile && { flexDirection: "column" }]}>
              <View style={[styles.featureCard]}>
                <Text style={styles.featureIcon}>👴</Text>
                <Text style={styles.featureTitle}>For Seniors</Text>
                <Text style={[styles.featureSubtitle, { color: colors.primary }]}>Care & Companionship</Text>
                <Text style={styles.featureDesc}>Find assistance with daily tasks, companionship, and engaging community events tailored for your comfort.</Text>
              </View>
              <View style={[styles.featureCard]}>
                <Text style={styles.featureIcon}>🤝</Text>
                <Text style={styles.featureTitle}>For Volunteers</Text>
                <Text style={[styles.featureSubtitle, { color: colors.success }]}>Make a Meaningful Impact</Text>
                <Text style={styles.featureDesc}>Share your skills and time to brighten someone's day while gaining invaluable life experience.</Text>
              </View>
              <View style={[styles.featureCard]}>
                <Text style={styles.featureIcon}>🏢</Text>
                <Text style={styles.featureTitle}>For NGOs</Text>
                <Text style={[styles.featureSubtitle, { color: colors.accent }]}>Efficient Resource Management</Text>
                <Text style={styles.featureDesc}>Access professional tools to manage programs and connect with dedicated volunteers effortlessly.</Text>
              </View>
          </View>
        </View>


        {/* ─── Services Grid ─── */}
        <View style={[styles.section, { backgroundColor: colors.dark }]}>
          <Text style={styles.sectionLabel}>FEATURES</Text>
          <Text style={[styles.sectionTitle, isMobile && { fontSize: 28 }]}>
            Everything You Need
          </Text>

          <View style={[styles.servicesGrid, isMobile && { flexDirection: "column" }]}>
            {[
              { icon: "💊", title: "Medicine Delivery", desc: "Timely medication delivery right to your doorstep" },
              { icon: "🤖", title: "AI Chatbot", desc: "24/7 AI assistance for urgent queries and support" },
              { icon: "📋", title: "Medical Records", desc: "Secure storage for your complete medical history" },
              { icon: "🎉", title: "Social Events", desc: "Community events to keep you connected and engaged" },
            ].map((item) => (
              <View key={item.title} style={styles.serviceCard}>
                <Text style={styles.serviceIcon}>{item.icon}</Text>
                <Text style={styles.serviceTitle}>{item.title}</Text>
                <Text style={styles.serviceDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Innovation Section ─── */}
        <View style={styles.section}>
          <View style={[styles.innovationRow, isMobile && { flexDirection: "column" }]}>
            <View style={[styles.innovationLeft, !isMobile && { flex: 1 }]}>
              <Text style={styles.sectionLabel}>WHY CHOOSE US</Text>
              <Text style={[styles.sectionTitle, { textAlign: "left" }, isMobile && { fontSize: 28 }]}>
                Innovative support designed for everyday life.
              </Text>
              <Text style={[styles.sectionSubtitle, { textAlign: "left" }]}>
                We combine the warmth of human connection with cutting-edge technology to ensure safety, health, and happiness.
              </Text>
            </View>
              <View style={[styles.innovationRight, !isMobile && { flex: 1 }]}>
                {[
                  "Verified professional volunteers only",
                  "Secure storage for medical history",
                  "24/7 AI assistance for urgent queries",
                  "Community-driven support network",
                ].map((item) => (
                  <View key={item} style={styles.checkItem}>
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                    <Text style={styles.checkText}>{item}</Text>
                  </View>
                ))}
              </View>
          </View>
        </View>

        {/* ─── Mission Section ─── */}
        <View style={[styles.section, { backgroundColor: colors.dark }]}>
          <View style={styles.missionCard}>
            <Text style={styles.sectionLabel}>OUR MISSION</Text>
            <Text style={[styles.sectionTitle, isMobile && { fontSize: 28 }]}>
              Building a Safer, More Connected World
            </Text>
            <Text style={[styles.sectionSubtitle, { maxWidth: 700 }]}>
              We believe every senior deserves to age with dignity, surrounded by a community that cares. Through compassionate volunteerism and technological innovation, we're bridging the gap between generations.
            </Text>
          </View>
        </View>

        {/* ─── CTA Section ─── */}
        <View style={styles.ctaSection}>
          <Text style={[styles.ctaTitle, isMobile && { fontSize: 28 }]}>
            Ready to Make a Difference?
          </Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of members already making an impact in their local communities. Start your journey today.
          </Text>
          <View style={[styles.ctaButtons, isMobile && { flexDirection: "column" }]}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => navigation.navigate("RoleSelect")}
            >
              <Text style={styles.heroPrimaryBtnText}>Join Now →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.heroSecondaryBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Footer ─── */}
        <View style={styles.footer}>
          <View style={[styles.footerTop, isMobile && { flexDirection: "column", gap: 30 }]}>
            <View style={styles.footerBrand}>
              <Text style={styles.logoText}>🤝 ElderConnect</Text>
              <Text style={styles.footerBrandDesc}>
                Dedicated to enhancing the quality of life for seniors through compassionate volunteerism and technological innovation.
              </Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Platform</Text>
              {["Home", "About Us", "Benefits", "Contact"].map((link) => (
                <Text key={link} style={styles.footerLink}>{link}</Text>
              ))}
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Legal</Text>
              {["Privacy Policy", "Terms of Service", "Accessibility"].map((link) => (
                <Text key={link} style={styles.footerLink}>{link}</Text>
              ))}
            </View>
          </View>
          <View style={styles.footerBottom}>
            <Text style={styles.footerCopyright}>© 2024 ElderConnect. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Sub Components ── */

const FeatureCard = ({ icon, title, subtitle, description, color }) => (
  <View style={[styles.featureCard, { borderTopColor: color, borderTopWidth: 3 }]}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={[styles.featureSubtitle, { color }]}>{subtitle}</Text>
    <Text style={styles.featureDesc}>{description}</Text>
  </View>
);

/* ── Styles ── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  /* Navbar */
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: `${colors.bg}F0`,
  },
  navLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: "800", color: colors.primary, letterSpacing: 0.3 },
  navLinks: { flexDirection: "row", gap: 32 },
  navLink: { color: colors.muted, fontSize: 14, fontWeight: "500" },
  navRight: { flexDirection: "row", gap: 12 },
  loginBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loginBtnText: { color: colors.text, fontWeight: "600", fontSize: 14 },
  registerBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  registerBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  /* Hero */
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },
  heroBadge: {
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  heroBadgeText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  heroTitle: {
    fontSize: 56,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    lineHeight: 66,
    letterSpacing: -1,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 18,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 650,
    lineHeight: 28,
    marginBottom: 40,
  },
  heroButtons: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 60,
  },
  heroPrimaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 160,
    alignItems: "center",
  },
  heroPrimaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  heroSecondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 160,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  heroSecondaryBtnText: { color: colors.text, fontWeight: "600", fontSize: 16 },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    gap: 40,
    backgroundColor: colors.card,
    paddingVertical: 28,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 28, fontWeight: "800", color: colors.text },
  statLabel: { color: colors.muted, fontSize: 13, marginTop: 4 },

  /* Section */
  section: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 600,
    lineHeight: 26,
    marginBottom: 48,
    alignSelf: "center",
  },

  /* Features Grid */
  featuresGrid: {
    flexDirection: "row",
    gap: 20,
    maxWidth: 1100,
    alignSelf: "center",
    width: "100%",
  },
  featureCard: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: "transparent",
  },
  featureIcon: { fontSize: 36, marginBottom: 16 },
  featureTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 4 },
  featureSubtitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  featureDesc: { fontSize: 14, color: colors.muted, lineHeight: 22 },

  /* Services Grid */
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
  },
  serviceCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  serviceIcon: { fontSize: 36, marginBottom: 12 },
  serviceTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 6, textAlign: "center" },
  serviceDesc: { fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 20 },

  /* Innovation */
  innovationRow: {
    flexDirection: "row",
    gap: 48,
    maxWidth: 1000,
    alignSelf: "center",
    width: "100%",
  },
  innovationLeft: {},
  innovationRight: { gap: 16, justifyContent: "center" },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.success}20`,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: { color: colors.success, fontWeight: "700", fontSize: 14 },
  checkText: { color: colors.text, fontSize: 15, fontWeight: "500", flex: 1 },

  /* Mission */
  missionCard: {
    maxWidth: 800,
    alignSelf: "center",
    alignItems: "center",
  },

  /* CTA */
  ctaSection: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ctaTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 550,
    lineHeight: 26,
    marginBottom: 36,
  },
  ctaButtons: {
    flexDirection: "row",
    gap: 16,
  },

  /* Footer */
  footer: {
    backgroundColor: colors.dark,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  footerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    maxWidth: 1000,
    alignSelf: "center",
    width: "100%",
    paddingBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  footerBrand: { maxWidth: 350 },
  footerBrandDesc: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 12 },
  footerCol: { gap: 10 },
  footerColTitle: { color: colors.text, fontWeight: "700", fontSize: 14, marginBottom: 6 },
  footerLink: { color: colors.muted, fontSize: 14 },
  footerBottom: {
    paddingVertical: 24,
    alignItems: "center",
  },
  footerCopyright: { color: colors.subtle, fontSize: 13 },
});
