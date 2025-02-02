import Link from "next/link";

export function Footer() {
  return (
    <div className="h-20 bg-gray-100 min-w-[750px] flex items-center">
      <div className="container mx-auto flex justify-center items-center">

        <Link
          className="text-blue-900 hover:text-blue-500"
          href="https://www.linkedin.com/in/pushparajl"
        >
          © Website developed by Pushparaj L
        </Link>
      </div>
    </div>
  );
}
