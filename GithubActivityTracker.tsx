import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

type TeamMember = {
  username: string;
  commits: number;
  issues: number;
  active: boolean;
  error?: boolean;
};

type GitHubCommit = {
  commit: {
    author: {
      date: string;
    };
  };
};

type GitHubIssue = {
  id: number;
  created_at: string;
};

const TEAM_MEMBERS = [
  'elmisback',
  'NoxNovus',
  'jaelafield',
  'parthrdesai',
  'benwang33'
] as const;

const GithubActivityTracker: React.FC = () => {
  const [activities, setActivities] = useState<TeamMember[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkActivity = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const results = await Promise.all(TEAM_MEMBERS.map(async (username) => {
        try {
          const [commitsResp, issuesResp] = await Promise.all([
            fetch(`https://api.github.com/repos/herbie-fp/odyssey/commits?author=${username}&since=${yesterday.toISOString()}`),
            fetch(`https://api.github.com/repos/herbie-fp/odyssey/issues?creator=${username}&since=${yesterday.toISOString()}`)
          ]);

          if (!commitsResp.ok || !issuesResp.ok) {
            throw new Error(`API error: ${commitsResp.status} ${issuesResp.status}`);
          }

          const commits = await commitsResp.json() as GitHubCommit[];
          const issues = await issuesResp.json() as GitHubIssue[];

          return {
            username,
            commits: commits.length,
            issues: issues.length,
            active: commits.length > 0 || issues.length > 0
          };
        } catch (err) {
          console.error(`Error fetching data for ${username}:`, err);
          return {
            username,
            commits: 0,
            issues: 0,
            active: false,
            error: true
          };
        }
      }));

      const hasErrors = results.some(result => result.error);
      if (hasErrors) {
        setError('Some data could not be fetched. Results may be incomplete.');
      }

      setActivities(results);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Failed to fetch GitHub data. Please try again later.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Odyssey Team Activity Tracker</CardTitle>
        <Button 
          onClick={checkActivity}
          disabled={loading}
          className="ml-4"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking
            </>
          ) : (
            'Check Now'
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {lastChecked && (
            <div className="text-sm text-gray-500 mb-4">
              Last checked: {lastChecked}
            </div>
          )}

          {activities && (
            <div className="space-y-4">
              <div className="divide-y">
                {activities.map((user) => (
                  <div key={user.username} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {user.error ? (
                        <XCircle className="h-5 w-5 text-yellow-500" />
                      ) : user.active ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {user.error ? (
                        <span>Failed to fetch data</span>
                      ) : (
                        <>
                          {user.commits > 0 && (
                            <span className="mr-4">
                              Commits: {user.commits}
                            </span>
                          )}
                          {user.issues > 0 && (
                            <span>
                              Issues: {user.issues}
                            </span>
                          )}
                          {!user.active && (
                            <span>No activity</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GithubActivityTracker;
