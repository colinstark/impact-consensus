export function voteStats(article, userId) {
  const agree = article.votes.filter((v) => v.stance === 'agree').length
  const mine = article.votes.find((v) => v.user_id === userId)?.stance
  return { agree, disagree: article.votes.length - agree, mine }
}

export const hostOf = (url) => URL.parse(url)?.hostname.replace(/^www\./, '') ?? url

export const headlineOf = (article) => article.statement ?? article.title ?? article.url
