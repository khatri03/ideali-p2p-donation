export const myFundraisingPath = '/member/my-fundraising';

export const editMyFundraisingPath = (fundraiserUniqueId: string) =>
  `${myFundraisingPath}/${fundraiserUniqueId}`;
