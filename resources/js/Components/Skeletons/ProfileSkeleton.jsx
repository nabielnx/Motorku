import Skeleton from '@/Components/Skeleton';

export default function ProfileSkeleton() {
    return (
        <div className="py-2 sm:py-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-5 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3.5 w-72 max-w-full" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
                <Skeleton className="h-5 w-36" />
                <div className="flex items-center gap-4">
                    <Skeleton variant="circle" className="w-16 h-16 shrink-0" />
                    <div className="min-w-0 space-y-2 flex-1"><Skeleton className="h-8 w-32 max-w-full rounded-lg" /><Skeleton className="h-3 w-48 max-w-full" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-10 w-full rounded-lg" /></div>
                    <div className="space-y-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-10 w-full rounded-lg" /></div>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 sm:p-6 space-y-4">
                <Skeleton className="h-5 w-36" />
                <div className="space-y-3 max-w-md">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}
