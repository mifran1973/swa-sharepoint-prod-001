// SharePoint data types based on the API response
export interface SharePointUser {
  DisplayName: string;
  Id: string;
  email?: string;
}

export interface SharePointApplication {
  DisplayName: string;
  Id: string;
}

export interface SharePointCreatedBy {
  User: SharePointUser;
  Application?: SharePointApplication;
}

export interface SharePointContentType {
  Id: string;
  Name: string;
}

export interface SharePointParentReference {
  Id: string;
  SiteId: string;
}

export interface SharePointTicket {
  Id: string;
  CreatedBy: SharePointCreatedBy;
  CreatedDateTime: string;
  LastModifiedBy: SharePointCreatedBy;
  LastModifiedDateTime: string;
  ContentType: SharePointContentType;
  ParentReference: SharePointParentReference;
  WebUrl: string;
  ETag: string;
  // Add custom fields as needed
  Fields?: {
    Title?: string;
    Description?: string;
    Status?: string;
    Priority?: string;
    AssignedTo?: string;
    Category?: string;
  };
}

export interface SharePointApiResponse {
  value: SharePointTicket[];
}