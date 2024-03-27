import csv

from google.auth import default
from google.auth.exceptions import DefaultCredentialsError
from google.cloud import storage
from google.cloud.sql.connector import Connector
import sqlalchemy

def find_weighted_pnl(mov):
  T = len(mov) #number of teams
  weights = [1/T for i in range(T)]
  ITERS = 100
  a = 1 - 2/T #hyper parameter tuning...
  newW = [(1 - a)/(1 - pow(a,T)) * pow(a,i) for i in range(0,T)] #exponential weights (sum to 1)
  for x in range(ITERS):
      items = []
      for i in range(T):
          items.append([sum([mov[i][j] * weights[j] for j in range(T)]),i])
      items.sort(reverse=True)
      for i in range(T):
          weights[items[i][1]] = newW[i]
  return items

def calculate_margin_of_victory(matches, T):
    mov = [[0 for i in range(T)] for j in range(T)]
    for scores in matches:
        assert(len(scores) == 2)
        i, iscore = scores[0]
        j, jscore = scores[1]
        mov[i][j] = iscore - jscore # confirm?
        mov[j][i] = -mov[i][j]
        return

'''
Returns (T, idxs, matches), where:
    T = number of teams
    idxs[teamId] = numerical index i for looking up teamId, where 0 <= i < T
    matches = list of [(i, bankroll_i), (j, bankroll_j)],
                where in a match between teams i and j,
                    i scored bankroll_i and j scored bankroll_j
    '''
def parse_matches(matches_rows):
    match_dict = {}
    idx = 0
    idxs = {}

    for row in matches_rows:
        teamId = row['teamId']
        matchId = row['matchId']
        score = row['bankroll']
        if matchId not in match_dict:
            match_dict[matchId] = []
        if teamId not in idxs:
            idxs[teamId] = idx
            idx += 1
        match_dict[matchId].append((idxs[teamId], score))

    return idx, idxs, match_dict.values()

def get_credentials():
    try:
        credentials, _ = default()
        return credentials
    except DefaultCredentialsError:
        print(
            "Google Cloud Authentication credentials not found, writing logs locally."
        )
        return None
    
def get_matches():
    instance_connection_name = "pokerai-417521:us-east4:pokerai-sql"
    db_user = "root"
    db_pass = ".YFHUMhVJry#'SDt"
    db_name = "pokerai-db"

    if not (instance_connection_name or db_user or db_pass or db_name):
        print("No connection name or database credentials found, skipping.")
        return

    with Connector() as connector:

        def getconn() -> sqlalchemy.engine.base.Connection:
            conn = connector.connect(
                instance_connection_name,
                "pymysql",
                user=db_user,
                password=db_pass,
                db=db_name,
                ip_type="private"
            )
            return conn

        pool = sqlalchemy.create_engine(
            "mysql+pymysql://",
            creator=getconn,
        )

        try:
            with pool.connect() as db_conn:
                # Check if player names exist in the 'TeamDao' table
                query_teams = sqlalchemy.text("""
                    SELECT *
                    FROM TeamMatchDao
                    WHERE matchId LIKE 'final-%'
                """)
                result = db_conn.execute(
                    query_teams
                )
                teams = set(row[0] for row in result)

                print(teams)
                print("Queried for teams")

        except Exception as e:
            print(f"Error while interacting with the database: {str(e)}")
            db_conn.rollback()
    
T, idxs, matches = parse_matches(get_matches())
mov = calculate_margin_of_victory(matches, T)
print(find_weighted_pnl(mov))