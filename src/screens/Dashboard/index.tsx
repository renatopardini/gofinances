import React, { useState, useEffect, useCallback } from "react";
import { ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getBottomSpace } from "react-native-iphone-x-helper";
import { HighlightCard } from "../../components/HighlightCard";
import { TransactionCard, TransactionCardProps } from "../../components/TransactionCard";

import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from 'styled-components'
import { useAuth } from '../../hooks/auth'

export interface DateListProps extends TransactionCardProps {
  id: string;
}

interface HighlightProps {
  total: string;
  lastTransaction: string;
}
interface HighlightData {
  entries: HighlightProps;
  expencives: HighlightProps;
  total: HighlightProps;
}

import { 
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon, 
  HighlightCards,
  Transactions,
  Title, 
  TransactionList,
  LogoutButton,
  LoadContainer
} from "./styles";

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<DateListProps[]>([]);
  const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData)
  
  const theme = useTheme()
  const { signOut, user } = useAuth()

  function getLastTransactionDate(
    collection: DateListProps[],
    type: 'positive' | 'negative'
  ){
    const lastTransaction = new Date(
    Math.max.apply(Math, collection
    .filter(transaction => transaction.type === type)
    .map(transaction => new Date(transaction.date).getTime())))

    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: 'long' })}`;
  }

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`
    
    const response = await AsyncStorage.getItem(dataKey)
    const transactions = response ? JSON.parse(response) : []

    let entriesTotal = 0;
    let expansiveTotal = 0;
    
    const transactionsFormatted: DateListProps[] = transactions.map((item: DateListProps) => {
      if (item.type === 'positive') {
        entriesTotal += Number(item.amount)
      } else {
        expansiveTotal += Number(item.amount)
      }

      const amount = Number(item.amount).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })

      const date = Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }).format(new Date(item.date))

      return {
        id: item.id,
        name: item.name,
        amount,
        type: item.type,
        category: item.category,
        date,
      }
      
    })
    
    setData(transactionsFormatted)

    const lastTransactionEntries = getLastTransactionDate(transactions, 'positive');
    const lastTransactionExpensives = getLastTransactionDate(transactions, 'negative');
    const totalInterval = `01 a ${lastTransactionExpensives}`;

    const total = entriesTotal - expansiveTotal;

    setHighlightData({
      entries: {
        total: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRl'
        }),
        lastTransaction: `Última entrada dia ${lastTransactionEntries}`,
      },
      expencives: {
        total: expansiveTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRl'
        }),
        lastTransaction: `Última entrada dia ${lastTransactionExpensives}`,
      },
      total: {
        total: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRl'
        }),
        lastTransaction: `Última entrada dia ${totalInterval}`,
      }
    })

    setIsLoading(false)
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  useFocusEffect(useCallback(() => {
    loadTransactions()
  }, []))

  return (
    <Container>
      {
        isLoading ? <LoadContainer><ActivityIndicator color={theme.colors.primary} size='large' /></LoadContainer> :
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo source={{uri: user.photo}}/>
                <User>
                  <UserGreeting>Ola, </UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>

              <LogoutButton onPress={signOut}>
                <Icon name='power' />
              </LogoutButton>
            </UserWrapper>
          </Header>

          <HighlightCards>
            <HighlightCard type="up" title='Entradas' amount={highlightData.entries.total} lastTransaction={highlightData.entries.lastTransaction} />
            <HighlightCard type="down" title='Saidas' amount={highlightData.expencives.total} lastTransaction={highlightData.expencives.lastTransaction} />
            <HighlightCard type="total" title='Total' amount={highlightData.total.total} lastTransaction={highlightData.total.lastTransaction} />
          </HighlightCards>
          
          <Transactions>
            <Title>Listagem</Title>

            <TransactionList
              data={data}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />
            
          </Transactions>
        </>
      }
    </Container>
  )
}