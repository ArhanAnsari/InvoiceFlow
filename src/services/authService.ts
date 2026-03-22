import { ID, account } from "./appwrite";

export const loginWithEmail = (email: string, password: string) =>
  account.createEmailPasswordSession(email, password);

export const registerWithEmail = async (
  email: string,
  password: string,
  name: string,
) => {
  await account.create(ID.unique(), email, password, name);
  return loginWithEmail(email, password);
};

export const getCurrentUser = () => account.get();

export const logout = () => account.deleteSession("current");

export const logoutAllDevices = () => account.deleteSessions();

export const sendOTP = async (email: string) => {
  const token = await account.createEmailToken(ID.unique(), email);
  return token.userId;
};

export const verifyOTP = (userId: string, otp: string) =>
  account.createSession(userId, otp);

export const checkSession = async () => {
  try {
    return await account.get();
  } catch {
    return null;
  }
};
