import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator, RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminSidebar, { MobileBottomBar } from "../components/AdminSidebar";
import useResponsive from "../hooks/useResponsive";
import api from "../api";

const colors = {
  bg: "#0F172A", card: "#1E293B", border: "#334155", primary: "#4799EB",
  success: "#22C55E", warning: "#F59E0B", danger: "#EF4444", text: "#F1F5F9", muted: "#94A3B8",
};

export default function AdminActivityMonitoring({ navigation }) {
  const responsive = useResponsive();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/admin/dashboard-stats");
      setData(res.data);
    } catch (err) {
      console.error("ACTIVITY ERROR:", err.response?.data || err);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Loading Activity Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { stats, usersByRole, requestsByType, requestsByStatus, recentRequests } = data || {};
  const getType = (t) => requestsByType?.find((r) => r._id === t)?.count || 0;
  const getStatus = (st) => requestsByStatus?.find((r) => r._id === st)?.count || 0;
  const getRole = (r) => usersByRole?.find((x) => x._id === r)?.count || 0;
  const totalReqs = (requestsByType || []).reduce((a, r) => a + r.count, 0) || 1;
  const totalUsersAll = (usersByRole || []).reduce((a, r) => a + r.count, 0) || 1;

  const types = [
    { label: "Medicine", type: "medicine", color: colors.primary, icon: "💊" },
    { label: "Food", type: "food", color: colors.success, icon: "🍽️" },
    { label: "Emergency", type: "emergency", color: colors.danger, icon: "🚨" },
  ];
  const statuses = [
    { label: "Pending", status: "pending", color: colors.warning },
    { label: "Assigned", status: "assigned", color: colors.primary },
    { label: "Completed", status: "completed", color: colors.success },
  ];
  const roles = [
    { label: "Elders", role: "elder", color: colors.warning, icon: "👴" },
    { label: "Volunteers", role: "volunteer", color: colors.success, icon: "🤝" },
    { label: "NGOs", role: "ngo", color: colors.primary, icon: "🏢" },
    { label: "Admins", role: "admin", color: colors.danger, icon: "🛡️" },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={[s.layout, { flexDirection: responsive.showSidebar ? "row" : "column" }]}>
        <AdminSidebar navigation={navigation} activeKey="AdminActivityMonitoring" />
        <ScrollView style={s.content} contentContainerStyle={[s.cc, { padding: responsive.contentPadding }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
          <Text style={s.heading}>Activity Monitoring</Text>
          <Text style={s.sub}>Comprehensive overview of platform activity and request analytics</Text>

          {/* Top Stats */}
          <View style={[s.statsRow, { flexDirection: responsive.isMobile ? "column" : "row" }]}>
            <View style={[s.statCard, { borderTopColor: colors.primary, borderTopWidth: 3 }]}>
              <Text style={s.statLabel}>Daily Activities</Text>
              <Text style={s.statBig}>{stats?.dailyActivities || 0}</Text>
              <Text style={s.statSub}>Today's activities</Text>
            </View>
            <View style={[s.statCard, { borderTopColor: colors.success, borderTopWidth: 3 }]}>
              <Text style={s.statLabel}>Total Requests</Text>
              <Text style={s.statBig}>{stats?.totalRequests || 0}</Text>
              <Text style={s.statSub}>All time</Text>
            </View>
            <View style={[s.statCard, { borderTopColor: colors.warning, borderTopWidth: 3 }]}>
              <Text style={s.statLabel}>Total Users</Text>
              <Text style={s.statBig}>{stats?.totalUsers || 0}</Text>
              <Text style={s.statSub}>Registered users</Text>
            </View>
          </View>

          {/* Charts Row 1 */}
          <View style={[s.chartsGrid, { flexDirection: responsive.chartRow ? "row" : "column" }]}>
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Daily Activity Trend</Text>
              <Text style={s.chartSub}>Last 7 Days</Text>
              <View style={s.barChart}>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => {
                  const h = [40,60,50,75,90,55,65];
                  return (
                    <View key={d} style={s.barW}>
                      <Text style={[s.barV, i===4&&{color:colors.primary}]}>{Math.round(h[i]*0.8)}</Text>
                      <View style={[s.bar, {height:h[i], backgroundColor: i===4?colors.primary:`${colors.primary}60`}]} />
                      <Text style={s.barL}>{d}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            {/* Request Types */}
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Requests by Type</Text>
              <Text style={s.chartSub}>Distribution of all requests</Text>
              <View style={s.donutRow}>
                {types.map((item) => {
                  const c = getType(item.type);
                  const pct = ((c/totalReqs)*100).toFixed(1);
                  return (
                    <View key={item.type} style={s.donutItem}>
                      <View style={[s.donutCircle, {borderColor:item.color}]}>
                        <Text style={[s.donutPct, {color:item.color}]}>{pct}%</Text>
                      </View>
                      <Text style={s.donutIcon}>{item.icon}</Text>
                      <Text style={s.donutLabel}>{item.label}</Text>
                      <Text style={[s.donutCount, {color:item.color}]}>{c}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={s.progressSection}>
                {types.map((item) => {
                  const c = getType(item.type);
                  const pct = (c/totalReqs)*100;
                  return (
                    <View key={item.type} style={s.progressRow}>
                      <View style={s.progressLR}>
                        <Text style={s.progressL}>{item.icon} {item.label}</Text>
                        <Text style={[s.progressV, {color:item.color}]}>{c}</Text>
                      </View>
                      <View style={s.progressBg}>
                        <View style={[s.progressFill, {width:`${Math.max(pct,3)}%`, backgroundColor:item.color}]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Charts Row 2 */}
          <View style={[s.chartsGrid, { flexDirection: responsive.chartRow ? "row" : "column" }]}>
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Request Status</Text>
              <Text style={s.chartSub}>Current status distribution</Text>
              <View style={s.statusGrid}>
                {statuses.map((item) => {
                  const c = getStatus(item.status);
                  return (
                    <View key={item.status} style={s.statusCard}>
                      <View style={[s.statusIconBg, {backgroundColor:`${item.color}20`}]}>
                        <View style={[s.statusDotL, {backgroundColor:item.color}]} />
                      </View>
                      <Text style={s.statusCL}>{item.label}</Text>
                      <Text style={[s.statusCV, {color:item.color}]}>{c}</Text>
                      <View style={s.statusBarBg}>
                        <View style={[s.statusBarF, {width:`${Math.max((c/totalReqs)*100,5)}%`, backgroundColor:item.color}]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            {/* Users by Role */}
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Users by Role</Text>
              <Text style={s.chartSub}>Platform user distribution</Text>
              <View style={s.roleGrid}>
                {roles.map((item) => {
                  const c = getRole(item.role);
                  const pct = ((c/totalUsersAll)*100).toFixed(0);
                  return (
                    <View key={item.role} style={s.roleCard}>
                      <Text style={s.roleIcon}>{item.icon}</Text>
                      <Text style={s.roleLabel}>{item.label}</Text>
                      <Text style={[s.roleCount, {color:item.color}]}>{c}</Text>
                      <View style={s.rolePBg}><View style={[s.rolePF, {width:`${Math.max(+pct,5)}%`, backgroundColor:item.color}]} /></View>
                      <Text style={s.rolePT}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Recent Requests */}
          <View style={s.secH}><Text style={s.secI}>📋</Text><Text style={s.secT}>Recent Requests</Text></View>
          <View style={s.tableCard}>
            <View style={s.tH}>
              {["Elder","Type","Volunteer","Status","Date"].map(h=><Text key={h} style={s.tHT}>{h}</Text>)}
            </View>
            {recentRequests?.length > 0 ? recentRequests.map((r, i) => (
              <View key={r._id} style={[s.tR, i%2===0&&s.tRA]}>
                <View style={s.cell}><Text style={s.cT}>{r.elder?.name||"—"}</Text></View>
                <View style={s.cell}>
                  <View style={[s.typeBadge, {backgroundColor: r.type==="medicine"?`${colors.primary}20`:r.type==="food"?`${colors.success}20`:`${colors.danger}20`}]}>
                    <Text style={[s.typeBT, {color: r.type==="medicine"?colors.primary:r.type==="food"?colors.success:colors.danger}]}>
                      {r.type?.charAt(0).toUpperCase()+r.type?.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={s.cell}><Text style={s.cT}>{r.volunteer?.name||"Unassigned"}</Text></View>
                <View style={s.cell}><Text style={[s.cT, {color: r.status==="completed"?colors.success:r.status==="assigned"?colors.primary:colors.warning}]}>{r.status?.charAt(0).toUpperCase()+r.status?.slice(1)}</Text></View>
                <View style={s.cell}><Text style={[s.cT, {color:colors.muted}]}>{r.createdAt?new Date(r.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"—"}</Text></View>
              </View>
            )) : <View style={s.empty}><Text style={s.emptyI}>📭</Text><Text style={s.emptyT}>No requests yet</Text></View>}
          </View>
          <View style={{height: responsive.showBottomBar ? 80 : 40}} />
        </ScrollView>

        <MobileBottomBar navigation={navigation} activeKey="AdminActivityMonitoring" />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.bg},
  loadingContainer:{flex:1,justifyContent:"center",alignItems:"center",gap:16},
  loadingText:{color:colors.muted,fontSize:16},
  layout:{flex:1},
  content:{flex:1}, cc:{},
  heading:{fontSize:28,fontWeight:"800",color:colors.text,letterSpacing:-0.5},
  sub:{color:colors.muted,marginBottom:24,marginTop:6,fontSize:15},
  statsRow:{gap:16,marginBottom:24},
  statCard:{flex:1,backgroundColor:colors.card,padding:22,borderRadius:14,borderWidth:1,borderColor:colors.border},
  statLabel:{color:colors.muted,fontSize:13,fontWeight:"500",marginBottom:8},
  statBig:{fontSize:36,fontWeight:"800",color:colors.text},
  statSub:{color:colors.muted,fontSize:12,marginTop:4},
  chartsGrid:{gap:16,marginBottom:24},
  chartCard:{flex:1,backgroundColor:colors.card,padding:24,borderRadius:14,borderWidth:1,borderColor:colors.border},
  chartTitle:{color:colors.text,fontSize:18,fontWeight:"700",marginBottom:4},
  chartSub:{color:colors.muted,fontSize:13,marginBottom:20},
  barChart:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end",height:120,gap:6,marginTop:8},
  barW:{alignItems:"center",flex:1,gap:4},
  barV:{color:colors.muted,fontSize:11},
  bar:{width:"100%",minWidth:18,borderRadius:4},
  barL:{color:colors.muted,fontSize:11},
  donutRow:{flexDirection:"row",justifyContent:"space-around",marginBottom:20},
  donutItem:{alignItems:"center",gap:6},
  donutCircle:{width:72,height:72,borderRadius:36,borderWidth:4,justifyContent:"center",alignItems:"center",backgroundColor:`${colors.bg}60`},
  donutPct:{fontSize:14,fontWeight:"800"},
  donutIcon:{fontSize:20},
  donutLabel:{color:colors.muted,fontSize:12,fontWeight:"600"},
  donutCount:{fontSize:16,fontWeight:"800"},
  progressSection:{gap:12},
  progressRow:{gap:6},
  progressLR:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  progressL:{color:colors.text,fontSize:13},
  progressV:{fontWeight:"700",fontSize:14},
  progressBg:{height:8,backgroundColor:`${colors.border}60`,borderRadius:4,overflow:"hidden"},
  progressFill:{height:"100%",borderRadius:4},
  statusGrid:{flexDirection:"row",gap:12,flexWrap:"wrap"},
  statusCard:{flex:1,minWidth:100,backgroundColor:`${colors.bg}60`,padding:16,borderRadius:12,alignItems:"center",gap:8},
  statusIconBg:{width:40,height:40,borderRadius:20,justifyContent:"center",alignItems:"center"},
  statusDotL:{width:14,height:14,borderRadius:7},
  statusCL:{color:colors.muted,fontSize:12,fontWeight:"600"},
  statusCV:{fontSize:24,fontWeight:"800"},
  statusBarBg:{width:"100%",height:6,backgroundColor:`${colors.border}40`,borderRadius:3,overflow:"hidden"},
  statusBarF:{height:"100%",borderRadius:3},
  roleGrid:{flexDirection:"row",gap:12,flexWrap:"wrap"},
  roleCard:{flex:1,minWidth:100,backgroundColor:`${colors.bg}60`,padding:16,borderRadius:12,alignItems:"center",gap:6},
  roleIcon:{fontSize:28},
  roleLabel:{color:colors.muted,fontSize:12,fontWeight:"600"},
  roleCount:{fontSize:22,fontWeight:"800"},
  rolePBg:{width:"100%",height:6,backgroundColor:`${colors.border}40`,borderRadius:3,overflow:"hidden"},
  rolePF:{height:"100%",borderRadius:3},
  rolePT:{color:colors.muted,fontSize:11},
  secH:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:14,marginTop:8},
  secI:{fontSize:22},
  secT:{fontSize:20,fontWeight:"700",color:colors.text},
  tableCard:{backgroundColor:colors.card,borderRadius:14,borderWidth:1,borderColor:colors.border,overflow:"hidden",marginBottom:24},
  tH:{flexDirection:"row",backgroundColor:`${colors.primary}15`,paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderColor:colors.border},
  tHT:{flex:1,color:colors.primary,fontWeight:"700",fontSize:12,textTransform:"uppercase",letterSpacing:0.5},
  tR:{flexDirection:"row",paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1,borderColor:`${colors.border}60`,alignItems:"center"},
  tRA:{backgroundColor:`${colors.bg}40`},
  cell:{flex:1,justifyContent:"center"},
  cT:{color:colors.text,fontSize:13},
  typeBadge:{paddingHorizontal:10,paddingVertical:4,borderRadius:6,alignSelf:"flex-start"},
  typeBT:{fontSize:12,fontWeight:"700"},
  empty:{alignItems:"center",paddingVertical:40,gap:8},
  emptyI:{fontSize:36},
  emptyT:{color:colors.muted,fontSize:15},
});
