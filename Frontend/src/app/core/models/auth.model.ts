import { User } from "./user.model";

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
  gender: 'male' | 'female';
  DOB: string;
  mobilePhone?: string;
  nationalId?: string;
}

export interface IAuthData {
  token: string;
  user: User;
}