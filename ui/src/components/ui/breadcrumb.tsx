import { Breadcrumb as ChakraBreadcrumb } from "@chakra-ui/react";
import { Link, useLocation } from "@tanstack/react-router";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const location = useLocation();
  
  // If items not provided, generate from pathname
  const breadcrumbItems = items || (() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const result: BreadcrumbItem[] = [];
    
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      result.push({
        label: index === pathSegments.length - 1 ? label : label,
        href: index === pathSegments.length - 1 ? undefined : currentPath,
      });
    });
    
    return result;
  })();

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <ChakraBreadcrumb.Root>
      <ChakraBreadcrumb.List>
        {breadcrumbItems.map((item, index) => (
          <ChakraBreadcrumb.Item key={index}>
            {index > 0 && <ChakraBreadcrumb.Separator />}
            {item.href ? (
              <ChakraBreadcrumb.Link asChild>
                <Link to={item.href}>{item.label}</Link>
              </ChakraBreadcrumb.Link>
            ) : (
              <ChakraBreadcrumb.CurrentLink>{item.label}</ChakraBreadcrumb.CurrentLink>
            )}
          </ChakraBreadcrumb.Item>
        ))}
      </ChakraBreadcrumb.List>
    </ChakraBreadcrumb.Root>
  );
}

