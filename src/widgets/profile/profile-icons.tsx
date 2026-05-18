import type { SVGProps } from "react";

type ProfileIconProps = SVGProps<SVGSVGElement>;

export function EditProfileIcon(props: ProfileIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path d="M12 20H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoutProfileIcon(props: ProfileIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 21h5a2 2 0 0 0 2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileFileIcon(props: ProfileIconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7L14 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 2V7h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileLibraryIcon(props: ProfileIconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M4 19V5a2 2 0 0 1 2-2h2v18H6a2 2 0 0 1-2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M10 21V3h4v18h-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 5.5l3-1 4.5 15-3 1L16 5.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 7h2M12 7h2M18 8l2.5-.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CreativityIcon(props: ProfileIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path d="M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 22h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8.5 15.5c-1.5-1.1-2.5-2.9-2.5-5A6 6 0 0 1 18 10.5c0 2.1-1 3.9-2.5 5-.8.6-1.5 1.3-1.5 2.5h-4c0-1.2-.7-1.9-1.5-2.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PublicCollectionsIcon(props: ProfileIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 3c2.2 2.4 3.5 5.4 3.5 9S14.2 18.6 12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 3c-2.2 2.4-3.5 5.4-3.5 9S9.8 18.6 12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CollectionLinkIcon(props: ProfileIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M8.4 12.6 6.9 14.1a3.25 3.25 0 0 0 4.6 4.6l2.4-2.4a3.25 3.25 0 0 0 0-4.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m15.6 11.4 1.5-1.5a3.25 3.25 0 0 0-4.6-4.6l-2.4 2.4a3.25 3.25 0 0 0 0 4.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="m9.5 14.5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.5 16.5c1.2.2 2 .9 2 1.7 0 1.2-1.9 2.1-4.3 2.1-1.1 0-2.1-.2-2.8-.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function OpenBookIcon(props: ProfileIconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
