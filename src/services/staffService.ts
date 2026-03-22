import {
    COLLECTIONS,
    DB_ID,
    ID,
    Permission,
    Query,
    Role,
    databases,
} from "./appwrite";

export const getStaffRoles = async (businessId: string) =>
  databases.listDocuments(DB_ID, COLLECTIONS.STAFF_ROLES, [
    Query.equal("businessId", businessId),
    Query.equal("isActive", true),
    Query.limit(100),
  ]);

export const inviteStaff = async (params: {
  businessId: string;
  ownerId: string;
  staffUserId: string;
  inviteEmail: string;
  role: "owner" | "manager" | "staff" | "viewer";
  permissions: string[];
}) =>
  databases.createDocument(
    DB_ID,
    COLLECTIONS.STAFF_ROLES,
    ID.unique(),
    {
      businessId: params.businessId,
      userId: params.staffUserId,
      role: params.role,
      permissions: params.permissions,
      invitedByUserId: params.ownerId,
      inviteEmail: params.inviteEmail,
      inviteStatus: "pending",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    [
      Permission.read(Role.user(params.ownerId)),
      Permission.write(Role.user(params.ownerId)),
      Permission.read(Role.user(params.staffUserId)),
    ],
  );

export const updateStaffInviteStatus = async (
  documentId: string,
  inviteStatus: "pending" | "accepted" | "rejected",
) =>
  databases.updateDocument(DB_ID, COLLECTIONS.STAFF_ROLES, documentId, {
    inviteStatus,
    updatedAt: new Date().toISOString(),
  });
