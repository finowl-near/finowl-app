package ai_test

import (
	"context"
	"finowl-backend/ai"
	"fmt"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_AnalyzeTweetsSimple(t *testing.T) {
	prompt := `respond with "pong" and only "pong" to any message`
	tweets := `ping`
	apiKey, found := os.LookupEnv("OPENAI_API_KEY")
	if !found {
		t.Fatal("missing deepseek api key")
	}
	agent := ai.NewDeepSeekAI(apiKey)

	resp, err := agent.AnalyzeTweets(context.Background(), prompt, tweets)
	require.NoError(t, err)

	fmt.Println(resp)
}

func TestAnalyzeTweets(t *testing.T) {
	prompt := `
	Analyze the following batch of tweets related to cryptocurrency trends and extract the following information:

Featured Tickers and Projects: Identify trending cryptocurrencies, tokens, or projects being discussed. Include the ticker symbol, project name, and a brief description of why it's trending.

Key Insights from Influencers: Extract insights, opinions, or predictions shared by influential figures in the crypto space. Include the influencer's name and their key insight.

Market Sentiment and Directions: Analyze the overall sentiment (bullish, bearish, neutral) and potential market directions based on the tweets. Include trends and potential directions.

Return the results in a structured MARKDOWN format
`

	tweets := `
MoneyLord: Binance measure volume with perps before spot listing 200m volume in 24hrs Looks good to me 😁
@somewheresy ∿ △ ⇑: #CHEESEWORLD filters coming soon to Centience Worlds
Levis💎: #GRIFFAIN doesn’t care if your in or out It’s sending to Valhalla with or without you Billions is written in the books 500m smashed
Dōgen: gm. #bitcoin bulls have the cleanest invalidation in the world: as long as $99k holds, it is bullish and could be considered to be entering a trending environment again.
Brook 💀 🧲: If you are losing money here, you need to be patient. Ape less. Wait. Wait some more. Pull the trigger only when you're confident it's a good narrative. Stop donating to derivative farms.
MoneyLord: Rai looks ready for another leg up 500m ⏳
Kaduna: Billions ⏳
MoneyLord: Griffain is the AI product that will stay here for many cycles It is like apple of AI
@somewheresy ∿ △ ⇑: In the AI Omegacycle, you should be buying tokens launched by AI devs, not crypto devs. Crypto devs are more likely to build vapor with good marketing (pump and dump). AI devs will build real stuff with little marketing (real products). There's much more edge in the latter.
him: The easiest way asymmetries form on already symmetric/popular assets — baseless FUD.
@somewheresy ∿ △ ⇑: my account feel funny
POΞ (🧲): $VIBE cat taking off
Bull.BnB: I mean non stop sending. And not a single red daily close. Not selling a single token below 100 mil mc
cryptogatsu: Our JizzTech has improved and we are coming with an even BETTER addition to #JIZZCOIN very soon!!! 💦😈
POΞ (🧲): Prepare for lift off #DJT4700 Trump season soon
@somewheresy ∿ △ ⇑: New rule: Make a PF coin and post CA in my comments = instablock
MoneyLord: On a longer TimeFrame current candles that seem big will look like midgets standing next to Shaquille O'Neal. #GRIFFAIN growth from all perspectives: --> Social Growth --> Tech Growth --> Holders Growth is too powerful. There is NO outcome where this doesn't go into billions.
💎GEM INSIDER💎: you think i would have made 106x on #virtual, 72x on #spx6900 and 81x on #fartcoin if i sell them too early? do what you think you need to do brother. the market will speak for itself.
Karthik Senthil: For all you DeFi lovers + degens, come check out the amazing DeFi apps + yields we have happening on Era. Super proud of the team who drove this from a piece of paper to a program in 4 months. Can't stop, won't stop.
zac.eth 🧙🏻♂♦: still holding @nft_xbt $NFTXBT
zac.eth 🧙🏻♂♦: still holding @nft_xbt $NFTXBT (35x)
nairolf: this tweet was a live test to show how dumb and easy to trick CT can be playbook: - underrate big and strong communities: Bitcoin & NFTs - overhype the hottest narrative: AI - deliberately ignore an obvious winner: DeFi - use a tier list to make people argue did i expect it to work? yes. did it work? absolutely.
@somewheresy ∿ △ ⇑: @shawmakesmagic damn my second favorite place in the US may have to go to this one
zac.eth 🧙🏻♂♦: Gemma (@gmgemma_ai) is a new AI research agent by @HeyAnonai - Tracks whale movements - Monitors social sentiment - Spots yield opportunities - Filters out noise - Integrates with execution tools for fast trades Part of the new DeFAI (AI x DeFi) wave @danielesesta
Uncle Bob Crypto: $POPPY | @PoppyTheHippo on eth is SURGING 👀🔥 The Solana version is also on fire 📛 but I reckon eventually the Eth version is going to catch some huge bids… Set your sails accordingly ⛵⛵🚀 <https://t.co/ZoKxMOfiij>
zac.eth 🧙🏻♂♦: Gemma (@gmgemma_ai) is a new AI research agent by @HeyAnonai - Tracks whale movements - Monitors social sentiment - Spots yield opportunities - Filters out noise - Integrates with execution tools for fast trades Part of the new DeFAI (AI x DeFi) wave Dev: @danielesesta $anon $wagmi
hitesh.eth: Opportunities Within the Emerging Trends 1. Agentic Metaverse $HYPER’s $200M+ market cap has brought fresh momentum to gaming x AI and agentic metaverse coins. Here’s what’s popping right now: • $REALIS: $27M (+64% in the last 24 hours) • $FREYA: $25M (+69%) • $LIMBO: $8M (+77%) Potential Plays: • @ARCAgents / $NRN: Leaders in reinforcement learning and gamification, yet to see significant capital inflow. • $BROT: Streaming agents playing Minecraft while interacting with the community. Fits the agentic metaverse narrative and could pick up momentum soon. There’s also growing interest in personality-driven agents—anime-style characters with dedicated fanbases but capital has yet to trickle here. These IPs are primed for the metaverse. Projects to watch: • $AVA • $LUNA • $MOE • $LUCY ———————————————— 2. Ecosystem Plays AI-powered ecosystems are thriving across multiple chains. If you’re looking to position early, here’s where to start: • $MODE for @modenetwork at $111M MC. Growing ecosystem of DeFAI / AI-powered dApps. • $VAPOR for @HyperliquidX at $96M MC. No agent that stands out yet. • $SUIAI for @SuiNetwork at $52M MC. $AIDA as KOL agent ($3M MC) shilling Sui projects. • $HOLD for @zkSync at $35M MC. $aiws as growing agent infrastructure enabling agents to autonomously set up cloud instances & pay for compute resources. • $AI9000 for @avax at $36M MC. Specializes in creating agents based on Twitter personas. No standout agent yet. • $OPEN for @arbitrum. Token not live, but Points Program is active for interacting with @aisweatshop & @opendesci. Keep an eye on these ecosystems. As their AI agent infrastructure matures, expect capital to rotate—just like we saw in the early days of Defi on L1s & L2s when CT race to invest in the number one DEXes & lending protocols on these chains. ———————————————— 3. AI
hitesh.eth: Oracle/Data This one’s still early, but it’s all about improving the data powering AI agents. • $COOKIE ($110M MC): Leading the pack as the number one data framework, known for lightning-fast feature rollouts. • $NOMAI ($33M MC): On-chain data hub with revenue-driven token burns. • $DREAM ($3M MC): An AI oracle using agent data for investment decisions. - $VANA is also interesting but given the nature of the token being an L1 with traditional tokenomics, the R/R doesn't make a lot of sense for CT to ape here If you’re betting on this trend, $COOKIE is your safest move. ———————————————— Final Thoughts The market is brimming with opportunities in these emerging trends. If you dig in, build your own thesis, and position yourself early, there’s plenty of potential for solid returns. Stay safe out there, and good luck navigating the agentic cycle bull run!
Solana Myth (🦍,🦍): Notice how all the bearish voices on the timeline are quiet
Solana Myth (🦍,🦍): the golden fabled bullrun
Solana Myth (🦍,🦍): gm crypto anon
`
	apiKey, found := os.LookupEnv("OPENAI_API_KEY")
	if !found {
		t.Fatal("missing deepseek api key")
	}
	agent := ai.NewDeepSeekAI(apiKey)

	resp, err := agent.AnalyzeTweets(context.Background(), prompt, tweets)
	require.NoError(t, err)

	fmt.Println(resp)
}
