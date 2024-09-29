import sys
import os

# Add the poker-engine-2025 directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
poker_engine_dir = os.path.join(current_dir, 'poker-engine-2025')
sys.path.append(poker_engine_dir)

# Import the test function from test.py
from run import run_api_match

def lambda_handler(event, context):
    print("Starting match")
    try:
        run_api_match()
        return {
            'statusCode': 200,
            'body': 'Match completed successfully'
        }
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return {
            'statusCode': 500,
            'body': f'An error occurred: {str(e)}'
        }

if __name__ == "__main__":
    lambda_handler(None, None)