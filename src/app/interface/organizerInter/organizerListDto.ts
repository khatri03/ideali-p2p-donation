import{genderResponseDto} from'../genderInter/genderResponseDto'

export interface organizerListDto  
{
  data: OrganizerListData[];
  success: boolean;
  message: string | null;
  errorCode: string | null;
  validationErrors: any | null;
  meta: any | null;
  timestamp: string;
}

export interface OrganizerListData{

}