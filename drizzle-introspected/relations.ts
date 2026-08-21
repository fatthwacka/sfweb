import { relations } from "drizzle-orm/relations";
import { shoots, videos, profiles, images, analytics, favorites, shootPreviews, previewImages, blogPosts, blogPostTags, blogTags, contentArticles, localSiteAssets, usersInAuth, whAgencyMembers, pricingPackages, contentClients, clientOutputDestinations, whAgencyClients, whAgencyReports, clientInputSources, blogCategories, ingestedArticles, whAgencyReportKpis, whAgencyReportCards, whAgencyCardStats, whAgencyCardSegments, socialContentHistory, topicCooldowns, whAgencyCardSeries, pipelineRuns, whAgencyCardItems, clients, clientSelections, selectionPackages, contentStrategies, contentRuns, contentAssets, clientPerformanceMetrics, brandLearning, generationLimits, toolUsage, blogMedia, subscriptions, visitorSessions, clientBrandProfiles, aiPromptOverrides, clientBrandAssets, mondayProjAuditLog, mondayProjUserProfiles, whAgencyReportEvents, whAgencyClientUsers } from "./schema";

export const videosRelations = relations(videos, ({one}) => ({
	shoot: one(shoots, {
		fields: [videos.shootId],
		references: [shoots.id]
	}),
}));

export const shootsRelations = relations(shoots, ({one, many}) => ({
	videos: many(videos),
	profile: one(profiles, {
		fields: [shoots.createdBy],
		references: [profiles.id]
	}),
	analytics: many(analytics),
	shootPreviews: many(shootPreviews),
	previewImages: many(previewImages),
	clientSelections: many(clientSelections),
	selectionPackages: many(selectionPackages),
	images: many(images),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	shoots: many(shoots),
	analytics: many(analytics),
	favorites: many(favorites),
	previewImages: many(previewImages),
	localSiteAssets: many(localSiteAssets),
	pricingPackages_createdBy: many(pricingPackages, {
		relationName: "pricingPackages_createdBy_profiles_id"
	}),
	pricingPackages_updatedBy: many(pricingPackages, {
		relationName: "pricingPackages_updatedBy_profiles_id"
	}),
	blogPosts: many(blogPosts),
	clients_createdBy: many(clients, {
		relationName: "clients_createdBy_profiles_id"
	}),
	clients_userId: many(clients, {
		relationName: "clients_userId_profiles_id"
	}),
	clientSelections: many(clientSelections),
	selectionPackages: many(selectionPackages),
	toolUsages: many(toolUsage),
	subscriptions: many(subscriptions),
	visitorSessions: many(visitorSessions),
	aiPromptOverrides: many(aiPromptOverrides),
	clientBrandAssets: many(clientBrandAssets),
}));

export const analyticsRelations = relations(analytics, ({one}) => ({
	image: one(images, {
		fields: [analytics.imageId],
		references: [images.id]
	}),
	shoot: one(shoots, {
		fields: [analytics.shootId],
		references: [shoots.id]
	}),
	profile: one(profiles, {
		fields: [analytics.userId],
		references: [profiles.id]
	}),
}));

export const imagesRelations = relations(images, ({one, many}) => ({
	analytics: many(analytics),
	favorites: many(favorites),
	shoot: one(shoots, {
		fields: [images.shootId],
		references: [shoots.id]
	}),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	image: one(images, {
		fields: [favorites.imageId],
		references: [images.id]
	}),
	profile: one(profiles, {
		fields: [favorites.userId],
		references: [profiles.id]
	}),
}));

export const shootPreviewsRelations = relations(shootPreviews, ({one}) => ({
	shoot: one(shoots, {
		fields: [shootPreviews.shootId],
		references: [shoots.id]
	}),
}));

export const previewImagesRelations = relations(previewImages, ({one}) => ({
	shoot: one(shoots, {
		fields: [previewImages.shootId],
		references: [shoots.id]
	}),
	profile: one(profiles, {
		fields: [previewImages.uploadedBy],
		references: [profiles.id]
	}),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({one}) => ({
	blogPost: one(blogPosts, {
		fields: [blogPostTags.postId],
		references: [blogPosts.id]
	}),
	blogTag: one(blogTags, {
		fields: [blogPostTags.tagId],
		references: [blogTags.id]
	}),
}));

export const blogPostsRelations = relations(blogPosts, ({one, many}) => ({
	blogPostTags: many(blogPostTags),
	contentArticles: many(contentArticles),
	profile: one(profiles, {
		fields: [blogPosts.authorId],
		references: [profiles.id]
	}),
	blogCategory: one(blogCategories, {
		fields: [blogPosts.categoryId],
		references: [blogCategories.id]
	}),
	contentClient: one(contentClients, {
		fields: [blogPosts.clientId],
		references: [contentClients.id]
	}),
	ingestedArticles: many(ingestedArticles),
	topicCooldowns: many(topicCooldowns),
	blogMedias: many(blogMedia),
}));

export const blogTagsRelations = relations(blogTags, ({many}) => ({
	blogPostTags: many(blogPostTags),
}));

export const contentArticlesRelations = relations(contentArticles, ({one}) => ({
	blogPost: one(blogPosts, {
		fields: [contentArticles.blogPostId],
		references: [blogPosts.id]
	}),
}));

export const localSiteAssetsRelations = relations(localSiteAssets, ({one}) => ({
	profile: one(profiles, {
		fields: [localSiteAssets.updatedBy],
		references: [profiles.id]
	}),
}));

export const whAgencyMembersRelations = relations(whAgencyMembers, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [whAgencyMembers.id],
		references: [usersInAuth.id]
	}),
	whAgencyReportEvents: many(whAgencyReportEvents),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	whAgencyMembers: many(whAgencyMembers),
	whAgencyReports: many(whAgencyReports),
	mondayProjAuditLogs: many(mondayProjAuditLog),
	mondayProjUserProfiles: many(mondayProjUserProfiles),
	whAgencyClientUsers: many(whAgencyClientUsers),
}));

export const pricingPackagesRelations = relations(pricingPackages, ({one}) => ({
	profile_createdBy: one(profiles, {
		fields: [pricingPackages.createdBy],
		references: [profiles.id],
		relationName: "pricingPackages_createdBy_profiles_id"
	}),
	profile_updatedBy: one(profiles, {
		fields: [pricingPackages.updatedBy],
		references: [profiles.id],
		relationName: "pricingPackages_updatedBy_profiles_id"
	}),
}));

export const clientOutputDestinationsRelations = relations(clientOutputDestinations, ({one}) => ({
	contentClient: one(contentClients, {
		fields: [clientOutputDestinations.clientId],
		references: [contentClients.id]
	}),
}));

export const contentClientsRelations = relations(contentClients, ({many}) => ({
	clientOutputDestinations: many(clientOutputDestinations),
	clientInputSources: many(clientInputSources),
	blogPosts: many(blogPosts),
	ingestedArticles: many(ingestedArticles),
	socialContentHistories: many(socialContentHistory),
	topicCooldowns: many(topicCooldowns),
	pipelineRuns: many(pipelineRuns),
	contentStrategies: many(contentStrategies),
	contentRuns: many(contentRuns),
	clientPerformanceMetrics: many(clientPerformanceMetrics),
	brandLearnings: many(brandLearning),
	generationLimits: many(generationLimits),
	clientBrandProfiles: many(clientBrandProfiles),
	aiPromptOverrides: many(aiPromptOverrides),
	clientBrandAssets: many(clientBrandAssets),
}));

export const whAgencyReportsRelations = relations(whAgencyReports, ({one, many}) => ({
	whAgencyClient: one(whAgencyClients, {
		fields: [whAgencyReports.clientId],
		references: [whAgencyClients.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [whAgencyReports.lockedBy],
		references: [usersInAuth.id]
	}),
	whAgencyReportKpis: many(whAgencyReportKpis),
	whAgencyReportCards: many(whAgencyReportCards),
	whAgencyReportEvents: many(whAgencyReportEvents),
}));

export const whAgencyClientsRelations = relations(whAgencyClients, ({many}) => ({
	whAgencyReports: many(whAgencyReports),
	whAgencyReportEvents: many(whAgencyReportEvents),
	whAgencyClientUsers: many(whAgencyClientUsers),
}));

export const clientInputSourcesRelations = relations(clientInputSources, ({one, many}) => ({
	contentClient: one(contentClients, {
		fields: [clientInputSources.clientId],
		references: [contentClients.id]
	}),
	ingestedArticles: many(ingestedArticles),
}));

export const blogCategoriesRelations = relations(blogCategories, ({many}) => ({
	blogPosts: many(blogPosts),
}));

export const ingestedArticlesRelations = relations(ingestedArticles, ({one}) => ({
	contentClient: one(contentClients, {
		fields: [ingestedArticles.clientId],
		references: [contentClients.id]
	}),
	blogPost: one(blogPosts, {
		fields: [ingestedArticles.matchedPostId],
		references: [blogPosts.id]
	}),
	clientInputSource: one(clientInputSources, {
		fields: [ingestedArticles.sourceId],
		references: [clientInputSources.id]
	}),
}));

export const whAgencyReportKpisRelations = relations(whAgencyReportKpis, ({one}) => ({
	whAgencyReport: one(whAgencyReports, {
		fields: [whAgencyReportKpis.reportId],
		references: [whAgencyReports.id]
	}),
}));

export const whAgencyReportCardsRelations = relations(whAgencyReportCards, ({one, many}) => ({
	whAgencyReport: one(whAgencyReports, {
		fields: [whAgencyReportCards.reportId],
		references: [whAgencyReports.id]
	}),
	whAgencyCardStats: many(whAgencyCardStats),
	whAgencyCardSegments: many(whAgencyCardSegments),
	whAgencyCardSeries: many(whAgencyCardSeries),
	whAgencyCardItems: many(whAgencyCardItems),
}));

export const whAgencyCardStatsRelations = relations(whAgencyCardStats, ({one}) => ({
	whAgencyReportCard: one(whAgencyReportCards, {
		fields: [whAgencyCardStats.cardId],
		references: [whAgencyReportCards.id]
	}),
}));

export const whAgencyCardSegmentsRelations = relations(whAgencyCardSegments, ({one}) => ({
	whAgencyReportCard: one(whAgencyReportCards, {
		fields: [whAgencyCardSegments.cardId],
		references: [whAgencyReportCards.id]
	}),
}));

export const socialContentHistoryRelations = relations(socialContentHistory, ({one}) => ({
	contentClient: one(contentClients, {
		fields: [socialContentHistory.clientId],
		references: [contentClients.id]
	}),
}));

export const topicCooldownsRelations = relations(topicCooldowns, ({one}) => ({
	blogPost: one(blogPosts, {
		fields: [topicCooldowns.blogPostId],
		references: [blogPosts.id]
	}),
	contentClient: one(contentClients, {
		fields: [topicCooldowns.clientId],
		references: [contentClients.id]
	}),
}));

export const whAgencyCardSeriesRelations = relations(whAgencyCardSeries, ({one}) => ({
	whAgencyReportCard: one(whAgencyReportCards, {
		fields: [whAgencyCardSeries.cardId],
		references: [whAgencyReportCards.id]
	}),
}));

export const pipelineRunsRelations = relations(pipelineRuns, ({one}) => ({
	contentClient: one(contentClients, {
		fields: [pipelineRuns.clientId],
		references: [contentClients.id]
	}),
}));

export const whAgencyCardItemsRelations = relations(whAgencyCardItems, ({one}) => ({
	whAgencyReportCard: one(whAgencyReportCards, {
		fields: [whAgencyCardItems.cardId],
		references: [whAgencyReportCards.id]
	}),
}));

export const clientsRelations = relations(clients, ({one}) => ({
	profile_createdBy: one(profiles, {
		fields: [clients.createdBy],
		references: [profiles.id],
		relationName: "clients_createdBy_profiles_id"
	}),
	profile_userId: one(profiles, {
		fields: [clients.userId],
		references: [profiles.id],
		relationName: "clients_userId_profiles_id"
	}),
}));

export const clientSelectionsRelations = relations(clientSelections, ({one}) => ({
	profile: one(profiles, {
		fields: [clientSelections.clientId],
		references: [profiles.id]
	}),
	shoot: one(shoots, {
		fields: [clientSelections.shootId],
		references: [shoots.id]
	}),
}));

export const selectionPackagesRelations = relations(selectionPackages, ({one}) => ({
	profile: one(profiles, {
		fields: [selectionPackages.clientId],
		references: [profiles.id]
	}),
	shoot: one(shoots, {
		fields: [selectionPackages.shootId],
		references: [shoots.id]
	}),
}));

export const contentStrategiesRelations = relations(contentStrategies, ({one, many}) => ({
	contentClient: one(contentClients, {
		fields: [contentStrategies.clientId],
		references: [contentClients.id]
	}),
	contentRuns: many(contentRuns),
}));

export const contentRunsRelations = relations(contentRuns, ({one, many}) => ({
	contentClient: one(contentClients, {
		fields: [contentRuns.clientId],
		references: [contentClients.id]
	}),
	contentStrategy: one(contentStrategies, {
		fields: [contentRuns.strategyId],
		references: [contentStrategies.id]
	}),
	contentAssets: many(contentAssets),
}));

export const clientPerformanceMetricsRelations = relations(clientPerformanceMetrics, ({one}) => ({
	contentAsset: one(contentAssets, {
		fields: [clientPerformanceMetrics.assetId],
		references: [contentAssets.id]
	}),
	contentClient: one(contentClients, {
		fields: [clientPerformanceMetrics.clientId],
		references: [contentClients.id]
	}),
}));

export const contentAssetsRelations = relations(contentAssets, ({one, many}) => ({
	clientPerformanceMetrics: many(clientPerformanceMetrics),
	contentRun: one(contentRuns, {
		fields: [contentAssets.runId],
		references: [contentRuns.id]
	}),
}));

export const brandLearningRelations = relations(brandLearning, ({one}) => ({
	contentClient: one(contentClients, {
		fields: [brandLearning.clientId],
		references: [contentClients.id]
	}),
}));

export const generationLimitsRelations = relations(generationLimits, ({one}) => ({
	contentClient: one(contentClients, {
		fields: [generationLimits.clientId],
		references: [contentClients.id]
	}),
}));

export const toolUsageRelations = relations(toolUsage, ({one}) => ({
	profile: one(profiles, {
		fields: [toolUsage.userId],
		references: [profiles.id]
	}),
}));

export const blogMediaRelations = relations(blogMedia, ({one}) => ({
	blogPost: one(blogPosts, {
		fields: [blogMedia.postId],
		references: [blogPosts.id]
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	profile: one(profiles, {
		fields: [subscriptions.userId],
		references: [profiles.id]
	}),
}));

export const visitorSessionsRelations = relations(visitorSessions, ({one}) => ({
	profile: one(profiles, {
		fields: [visitorSessions.userId],
		references: [profiles.id]
	}),
}));

export const clientBrandProfilesRelations = relations(clientBrandProfiles, ({one}) => ({
	contentClient: one(contentClients, {
		fields: [clientBrandProfiles.clientId],
		references: [contentClients.id]
	}),
}));

export const aiPromptOverridesRelations = relations(aiPromptOverrides, ({one}) => ({
	contentClient: one(contentClients, {
		fields: [aiPromptOverrides.clientId],
		references: [contentClients.id]
	}),
	profile: one(profiles, {
		fields: [aiPromptOverrides.createdBy],
		references: [profiles.id]
	}),
}));

export const clientBrandAssetsRelations = relations(clientBrandAssets, ({one}) => ({
	contentClient: one(contentClients, {
		fields: [clientBrandAssets.clientId],
		references: [contentClients.id]
	}),
	profile: one(profiles, {
		fields: [clientBrandAssets.createdBy],
		references: [profiles.id]
	}),
}));

export const mondayProjAuditLogRelations = relations(mondayProjAuditLog, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [mondayProjAuditLog.userId],
		references: [usersInAuth.id]
	}),
}));

export const mondayProjUserProfilesRelations = relations(mondayProjUserProfiles, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [mondayProjUserProfiles.id],
		references: [usersInAuth.id]
	}),
}));

export const whAgencyReportEventsRelations = relations(whAgencyReportEvents, ({one}) => ({
	whAgencyClient: one(whAgencyClients, {
		fields: [whAgencyReportEvents.clientId],
		references: [whAgencyClients.id]
	}),
	whAgencyReport: one(whAgencyReports, {
		fields: [whAgencyReportEvents.reportId],
		references: [whAgencyReports.id]
	}),
	whAgencyMember: one(whAgencyMembers, {
		fields: [whAgencyReportEvents.userId],
		references: [whAgencyMembers.id]
	}),
}));

export const whAgencyClientUsersRelations = relations(whAgencyClientUsers, ({one}) => ({
	whAgencyClient: one(whAgencyClients, {
		fields: [whAgencyClientUsers.clientId],
		references: [whAgencyClients.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [whAgencyClientUsers.userId],
		references: [usersInAuth.id]
	}),
}));